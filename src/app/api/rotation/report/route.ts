import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_createPlacement } from '@/services/placementService';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.includes('ROTATION')) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const { date } = await req.json(); // מקבל למשל "2024-05-19"
    
    // פתרון בעיית התאריך: פירוק המחרוזת ידנית כדי למנוע קפיצה ליום קודם בגלל שעות
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0); // קובעים לשעה 12 בצהריים כדי להיות בטוחים
    
    const daysArray = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayIndex = selectedDate.getDay(); 
    const dayOfWeek = daysArray[dayIndex];

    // --- לוגים לדיבאג (יופיעו בטרמינל של ה-VS Code) ---
    console.log("--- Absence Report Debug ---");
    console.log("Input Date String:", date);
    console.log("Calculated Day Name:", dayOfWeek);
    console.log("User ID from Session:", session.id);
    // -----------------------------------------------

    // חיפוש בטבלה
    const assignment = await prisma.fixedRotation.findFirst({
      where: {
        rotationTeacherId: session.id,
        day: dayOfWeek as any
      },
      include: {
        manager: {
          include: { 
            mainManagedInstitutions: true 
          }
        }
      }
    });

    if (!assignment) {
      console.log("RESULT: No assignment found in FixedRotation table for this user and day.");
      return NextResponse.json({ 
        message: `לא נמצא שיבוץ קבוע עבורך ליום ${dayOfWeek}. וודאי שאת רשומה כרוטציה אצל גננת אם ביום זה.` 
      }, { status: 400 });
    }

    if (!assignment.manager.mainManagedInstitutions || assignment.manager.mainManagedInstitutions.length === 0) {
      console.log("RESULT: Assignment found, but the Lead Teacher (Manager) has no institution assigned.");
      return NextResponse.json({ 
        message: `נמצא שאת משובצת אצל ${assignment.manager.firstName}, אך לא מוגדר עבורה גן במערכת.` 
      }, { status: 400 });
    }

    const institutionId = assignment.manager.mainManagedInstitutions[0].id;

    const newPlacement = await db_createPlacement({
      date: selectedDate,
      institutionId: institutionId,
      mainTeacherId: session.id,
      creatorRoles: session.roles,
      status: "OPEN"
    });

    console.log("RESULT: Success! Placement created.");
    return NextResponse.json(newPlacement);

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ message: "שגיאת שרת פנימית: " + error.message }, { status: 500 });
  }
}