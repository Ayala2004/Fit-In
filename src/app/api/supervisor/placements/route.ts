import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_createNotification } from '@/services/notificationService';

// פונקציה להבאת כל השיבוצים למפקחת (GET)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const instructors = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "INSTRUCTOR" },
      },
      include: {
        subordinatesIns: {
          include: {
            mainManagedInstitutions: true,
            placementsAsMain: {
              where: {
                date: {
                  gte: startOfToday,
                  lte: endOfToday,
                },
              },
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

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { placementId, substituteId, status } = await request.json();

    if (!placementId || !substituteId) {
      return NextResponse.json({ message: "חסרים נתונים לביצוע השיבוץ" }, { status: 400 });
    }

    // 1. עדכון השיבוץ - שימי לב לשמות לפי הסכימה: mainTeacher ו-substitute
    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: {
        substituteId: substituteId,
        status: status || "ASSIGNED",
      },
      include: {
        mainTeacher: true,   // הגננת הקבועה
        substitute: true,    // המחליפה
        institution: true,   // המוסד
      }
    });

    // 2. שליחת ההתראות לפי הנתונים שנשלפו
    if (updatedPlacement.substitute && updatedPlacement.mainTeacher) {
      const dateStr = new Date(updatedPlacement.date).toLocaleDateString('he-IL');
      const gardenName = updatedPlacement.institution.name;
      const subName = `${updatedPlacement.substitute.firstName} ${updatedPlacement.substitute.lastName}`;
      const mainTeacherName = `${updatedPlacement.mainTeacher.firstName} ${updatedPlacement.mainTeacher.lastName}`;

      // א. התראה למחליפה (שרה)
      await db_createNotification({
        userId: substituteId,
        title: "שיבוץ חדש עבורך",
        message: `שובצת לגן ${gardenName} בתאריך ${dateStr} במקום ${mainTeacherName}.`,
        type: "STATUS_UPDATE"
      });

      // ב. התראה לגננת הקבועה (mainTeacher)
      await db_createNotification({
        userId: updatedPlacement.mainTeacherId,
        title: "נמצאה מחליפה",
        message: `מעדכנים ש${subName} שובצה להחליף אותך בגן ${gardenName} בתאריך ${dateStr}.`,
        type: "STATUS_UPDATE"
      });

      // ג. התראה למדריכה (instructor) - נשלפת מה-mainTeacher
      if (updatedPlacement.mainTeacher.instructorId) {
        await db_createNotification({
          userId: updatedPlacement.mainTeacher.instructorId,
          title: "עדכון שיבוץ בגן",
          message: `נמצאה מחליפה (${subName}) לגן ${gardenName} בתאריך ${dateStr}.`,
          type: "STATUS_UPDATE"
        });
      }

      // ד. התראה למפקחת (את)
      await db_createNotification({
        userId: session.id,
        title: "שיבוץ בוצע בהצלחה",
        message: `שיבצת את ${subName} לגן ${gardenName} בתאריך ${dateStr}.`,
        type: "SYSTEM"
      });
    }

    return NextResponse.json(updatedPlacement);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ message: "שגיאה בעדכון ובשליחת התראות" }, { status: 500 });
  }
}