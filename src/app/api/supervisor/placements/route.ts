import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_createNotification } from '@/services/notificationService';

// --- GET: מחזיר את המדריכות והשיבוצים (לצורך הטבלה והחיפוש) ---
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // השאילתה הזו קריטית לחיפוש שלך - היא מחזירה מדריכות -> גננות -> שיבוצים
    const instructors = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "INSTRUCTOR" },
      },
      include: {
        subordinatesIns: {
          include: {
            mainManagedInstitutions: true, // המוסדות שהגננת מנהלת
            placementsAsMain: {
              where: {
                date: {
                  gte: startOfToday,
                  lte: endOfToday,
                },
              },
              include: {
                institution: true, // חשוב כדי להציג את שם הגן בטבלה
                substitute: true,  // חשוב כדי לראות מי המחליפה שכבר שובצה
              }
            },
          },
        },
      },
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error("GET Placements Error:", error);
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}

// --- PATCH: עדכון שיבוץ ושליחת התראות (מה שעשינו קודם) ---
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { placementId, substituteId, status } = await request.json();

    if (!placementId || !substituteId) {
      return NextResponse.json({ message: "חסרים נתונים" }, { status: 400 });
    }

    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: {
        substituteId: substituteId,
        status: status || "ASSIGNED",
      },
      include: {
        mainTeacher: true,
        substitute: true,
        institution: true,
      }
    });

    // לוגיקת ההתראות (כמו שסידרנו קודם)
    if (updatedPlacement.substitute && updatedPlacement.mainTeacher) {
      const dateStr = new Date(updatedPlacement.date).toLocaleDateString('he-IL');
      const gardenName = updatedPlacement.institution.name;
      const subName = `${updatedPlacement.substitute.firstName} ${updatedPlacement.substitute.lastName}`;
      const mainName = `${updatedPlacement.mainTeacher.firstName} ${updatedPlacement.mainTeacher.lastName}`;

      await db_createNotification({
        userId: substituteId,
        title: "שיבוץ חדש עבורך",
        message: `שובצת לגן ${gardenName} בתאריך ${dateStr} במקום ${mainName}.`,
        type: "STATUS_UPDATE"
      });

      await db_createNotification({
        userId: updatedPlacement.mainTeacherId,
        title: "נמצאה מחליפה",
        message: `מעדכנים ש${subName} שובצה להחליף אותך בגן ${gardenName} בתאריך ${dateStr}.`,
        type: "STATUS_UPDATE"
      });

      if (updatedPlacement.mainTeacher.instructorId) {
        await db_createNotification({
          userId: updatedPlacement.mainTeacher.instructorId,
          title: "עדכון שיבוץ בגן",
          message: `נמצאה מחליפה (${subName}) לגן ${gardenName} עבור הגננת ${mainName} בתאריך ${dateStr}.`,
          type: "STATUS_UPDATE"
        });
      }
    }

    return NextResponse.json(updatedPlacement);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ message: "שגיאה בעדכון" }, { status: 500 });
  }
}