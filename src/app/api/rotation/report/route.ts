import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_createPlacement } from '@/services/placementService';
import { startOfDay } from 'date-fns';
// src/app/api/rotation/report/route.ts

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.includes('ROTATION')) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const { date } = await req.json();
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0);
    const targetDate = startOfDay(selectedDate); // שימוש באחידות תאריכים

    const daysArray = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayOfWeek = daysArray[selectedDate.getDay()];

    // 1. חיפוש: האם היא משובצת היום כמחליפה (מילוי מקום חד פעמי)?
    const substitutePlacement = await prisma.placement.findFirst({
      where: {
        substituteId: session.id,
        date: targetDate,
        status: "ASSIGNED"
      }
    });

    // 2. חיפוש: האם יש לו גן קבוע היום (FixedRotation)?
    const fixedAssignment = await prisma.fixedRotation.findFirst({
      where: {
        rotationTeacherId: session.id,
        day: dayOfWeek as any
      },
      include: {
        manager: { include: { mainManagedInstitutions: true } }
      }
    });

    // לוגיקה: אם היא גם מחליפה וגם ביום קבוע (מה שלא אמור לקרות, אבל נתגונן)
    // אנחנו נבטל קודם את השיבוץ החד-פעמי ונפתח קריאה לגן הקבוע
    
    if (substitutePlacement) {
       // אם היא חולה, צריך לבטל את השיבוץ שלה כמחליפה כדי שהגן יחזור להיות OPEN
       await prisma.placement.update({
         where: { id: substitutePlacement.id },
         data: { substituteId: null, status: "OPEN" }
       });
       // אם אין לה גן קבוע היום, סיימנו את הדיווח כאן
       if (!fixedAssignment) {
         return NextResponse.json({ message: "דיווחך התקבל. השיבוץ שלקחת בוטל והגן חזר לרשימת ההמתנה." });
       }
    }

    if (!fixedAssignment) {
      if (substitutePlacement) return NextResponse.json({ success: true }); // כבר טופל למעלה
      return NextResponse.json({ 
        message: `לא נמצא שיבוץ קבוע או מילוי מקום עבורך ליום ${dayOfWeek}.` 
      }, { status: 400 });
    }

    // יצירת דיווח היעדרות לגן הקבוע (הפונקציה db_createPlacement שעדכנו קודם תחסום כפילויות)
    const institutionId = fixedAssignment.manager.mainManagedInstitutions[0].id;

    const newPlacement = await db_createPlacement({
      date: targetDate,
      institutionId: institutionId,
      mainTeacherId: session.id,
      creatorRoles: session.roles,
      status: "OPEN"
    });

    return NextResponse.json(newPlacement);

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}