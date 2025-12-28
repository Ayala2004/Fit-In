import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    // --- מקרה א': הקמת גן חדש (אין תאריך בבקשה) ---
    // נשלוף רק גננות אם שאין להן עדיין גן באחריותן
    if (!dateStr) {
      const availableForNewInstitution = await prisma.user.findMany({
        where: {
          supervisorId: session.id,
          roles: { has: "MANAGER" },
          // התנאי הקריטי: מחפשים משתמשת שאין לה (none) מוסדות בניהול ראשי
          mainManagedInstitutions: {
            none: {}
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          instructorId: true // נחוץ כדי להצמיד אוטומטית את המדריכה שלה לגן החדש
        }
      });
      
      return NextResponse.json(availableForNewInstitution);
    }

    // --- מקרה ב': דיווח יומי בלוח השנה (יש תאריך בבקשה) ---
    const selectedDate = new Date(dateStr);
    const dayOfWeek = format(selectedDate, 'EEEE').toUpperCase();

    // 1. נמצא את כל השיבוצים הקיימים באותו יום (כולל סגירות גן)
    const existingPlacements = await prisma.placement.findMany({
      where: {
        date: {
          gte: new Date(new Date(selectedDate).setHours(0,0,0,0)),
          lte: new Date(new Date(selectedDate).setHours(23,59,59,999))
        },
      },
      select: { mainTeacherId: true, substituteId: true }
    });

    const busyMainTeachers = existingPlacements.map(p => p.mainTeacherId);
    const busySubstitutes = existingPlacements.map(p => p.substituteId).filter(Boolean);

    // 2. שליפת גננות אם שיש להן גן ואין להן דיווח היום
    const availableManagers = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "MANAGER" },
        mainManagedInstitutions: { some: {} }, // חייב להיות להן גן כדי לדווח על היעדרות
        id: { notIn: busyMainTeachers }
      },
      select: {
        id: true, firstName: true, lastName: true,
        mainManagedInstitutions: { select: { id: true, name: true } }
      }
    });

    // 3. שליפת מחליפות (Substitutes) שהיום הוא יום עבודה שלהן ואינן משובצות
    const availableSubstitutes = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: dayOfWeek as any },
        id: { notIn: busySubstitutes as string[] }
      },
      select: { id: true, firstName: true, lastName: true }
    });

    return NextResponse.json({
      managers: availableManagers,
      substitutes: availableSubstitutes
    });

  } catch (error) {
    console.error("Managers API Error:", error);
    return NextResponse.json({ message: "שגיאה בסינון נתונים" }, { status: 500 });
  }
}