import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay } from "date-fns";
import { db_createNotification } from "@/services/notificationService";
import { db_createPlacement } from "@/services/placementService";

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

    const parseDateStr = (str: string) => {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
    };

    const absentDate = startOfDay(parseDateStr(dateAbsent));
    const workingDate = startOfDay(parseDateStr(dateWorking));

    // --- שלב 1: יצירת הדיווח הראשון (גננת האם נעדרת, הרוטציה מחליפה) ---
    // הפונקציה db_createPlacement כבר תבצע את כל בדיקות הזמינות וההתראות
    await db_createPlacement({
      date: absentDate.toISOString(),
      institutionId: institution.id,
      mainTeacherId: session.id,
      substituteId: rotationTeacherId,
      status: "ASSIGNED",
      notes: "החלפה פנימית (יום היעדרות מנהלת)",
      creatorRoles: session.roles
    });

    // --- שלב 2: יצירת הדיווח השני (גננת הרוטציה נעדרת מהיום שלה, האם מחליפה) ---
    try {
      await db_createPlacement({
        date: workingDate.toISOString(),
        institutionId: institution.id,
        mainTeacherId: rotationTeacherId,
        substituteId: session.id,
        status: "ASSIGNED",
        notes: "החלפה פנימית (יום החזר עבודה)",
        creatorRoles: session.roles
      });
    } catch (error: any) {
      // מקרה קצה: אם הדיווח הראשון הצליח אבל השני נכשל (למשל כפל שיבוץ ביום השני)
      // אנחנו נמחק את הדיווח הראשון כדי לא להשאיר נתונים חלקיים
      await prisma.placement.deleteMany({
        where: {
          mainTeacherId: session.id,
          date: absentDate,
          notes: { contains: "החלפה פנימית" }
        }
      });
      throw new Error(`ההחלפה בוטלה: ${error.message}`);
    }

    // --- שלב 3: הודעת סיכום למפקחת (התראות מפורטות כבר נשלחו ע"י ה-Service) ---
    await db_createNotification({
      userId: institution.supervisorId,
      title: "בוצעה החלפה פנימית",
      message: `גננת האם ${session.name} וגננת הרוטציה ביצעו החלפת ימים בגן ${institution.name}.`,
      type: "STATUS_UPDATE",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Swap Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}