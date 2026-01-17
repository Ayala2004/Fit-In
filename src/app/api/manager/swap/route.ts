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

    const institution = await prisma.institution.findFirst({
      where: { mainManagerId: session.id },
    });
    if (!institution) throw new Error("לא נמצא מוסד משויך");

    const absentDate = startOfDay(new Date(dateAbsent));
    const workingDate = startOfDay(new Date(dateWorking));

    // --- בדיקת כפילות בשרת ---
    const existing = await prisma.placement.findFirst({
      where: {
        institutionId: institution.id,
        date: { in: [absentDate, workingDate] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "אחד מהתאריכים שנבחרו כבר תפוס בדיווח קיים" },
        { status: 400 }
      );
    }

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

    // שליחת התראות על ההחלפה
    const dateStr1 = new Date(dateAbsent).toLocaleDateString("he-IL");
    const dateStr2 = new Date(dateWorking).toLocaleDateString("he-IL");
    const mainTeacher = await prisma.user.findFirst({
      where: { id:institution.mainManagerId },
    });

    const notificationTargets = [
      institution.supervisorId,
      institution.instructorId,
    ].filter(Boolean);

    for (const targetId of notificationTargets) {
      await db_createNotification({
        userId: targetId!,
        title: `החלפה פנימית: גן ${institution.name}`,
        message: `בוצעה החלפה בין גננת האם ${mainTeacher?.firstName} ${mainTeacher?.lastName}  לרוטציה בתאריכים ${dateStr1} ו-${dateStr2}`,
        type: "STATUS_UPDATE",
      });
    }

    // התראה לגננת הרוטציה (היא חייבת לדעת שזה קרה)
    await db_createNotification({
      userId: rotationTeacherId,
      title: "עודכן שיבוץ חדש (החלפה פנימית)",
      message: `עודכנה החלפה מול גננת האם בתאריכים ${dateStr1} ו-${dateStr2}`,
      type: "STATUS_UPDATE",
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
