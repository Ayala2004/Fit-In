// src/app/api/manager/swap/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay } from "date-fns";
import { db_createNotification } from "@/services/notificationService";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.includes("MANAGER"))
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const { dateAbsent, dateWorking, rotationTeacherId } = await req.json();

    // שליפת המוסד כולל פרטי המפקחת והמדריכה
    const institution = await prisma.institution.findFirst({
      where: { mainManagerId: session.id },
    });

    if (!institution) throw new Error("לא נמצא מוסד משויך");

    const absentDate = startOfDay(new Date(dateAbsent));
    const workingDate = startOfDay(new Date(dateWorking));

    // בדיקת כפילות
    const existing = await prisma.placement.findFirst({
      where: {
        institutionId: institution.id,
        date: { in: [absentDate, workingDate] },
        status: { not: "CANCELLED" }
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "אחד מהתאריכים שנבחרו כבר תפוס בדיווח קיים" },
        { status: 400 }
      );
    }

    // ביצוע ההחלפה במסד הנתונים
    await prisma.$transaction([
      prisma.placement.create({
        data: {
          date: absentDate,
          institutionId: institution.id,
          mainTeacherId: session.id,
          substituteId: rotationTeacherId,
          status: "ASSIGNED",
          notes: "החלפה פנימית",
        },
      }),
      prisma.placement.create({
        data: {
          date: workingDate,
          institutionId: institution.id,
          mainTeacherId: rotationTeacherId,
          substituteId: session.id,
          status: "ASSIGNED",
          notes: "החלפה פנימית",
        },
      }),
    ]);

    // הכנת נתונים להתראות
    const dateStr1 = absentDate.toLocaleDateString("he-IL");
    const dateStr2 = workingDate.toLocaleDateString("he-IL");
    const mainTeacherName = session.name; // השם מהסשן
    const gardenInfo = `בגן ${institution.name} (כתובת: ${institution.address})`;

    // 1. התראה למפקחת
    await db_createNotification({
      userId: institution.supervisorId,
      title: `החלפה פנימית: ${institution.name}`,
      message: `מפקחת יקרה, בוצעה החלפה פנימית ${gardenInfo}. גננת האם ${mainTeacherName} תעדר בתאריך ${dateStr1} ותחליף את הרוטציה בתאריך ${dateStr2}.`,
      type: "STATUS_UPDATE",
    });

    // 2. התראה למדריכה (אם קיימת)
    if (institution.instructorId) {
      await db_createNotification({
        userId: institution.instructorId,
        title: `החלפה פנימית: ${institution.name}`,
        message: `מדריכה יקרה, בוצעה החלפה פנימית ${gardenInfo}. גננת האם ${mainTeacherName} תעדר בתאריך ${dateStr1} ותחליף את הרוטציה בתאריך ${dateStr2}.`,
        type: "STATUS_UPDATE",
      });
    }

    // 3. התראה לגננת הרוטציה (המחליפה)
    await db_createNotification({
      userId: rotationTeacherId,
      title: "שיבוץ חדש (החלפה פנימית)",
      message: `גננת רוטציה יקרה, יש לך הזדמנות להחליף את ${mainTeacherName} ${gardenInfo} בתאריך ${dateStr1}, ובתמורה גננת האם תחליף אותך בתאריך ${dateStr2}.`,
      type: "STATUS_UPDATE",
    });

    // 4. התראה לגננת האם (אישור פעולה)
    await db_createNotification({
      userId: session.id,
      title: "אישור ביצוע החלפה",
      message: `גננת אם יקרה, ההחלפה הפנימית בוצעה בהצלחה ${gardenInfo}. היעדרותך: ${dateStr1}, יום החלפתך את הרוטציה: ${dateStr2}.`,
      type: "STATUS_UPDATE",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Swap Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}