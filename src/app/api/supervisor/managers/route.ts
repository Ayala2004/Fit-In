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
    if (!dateStr) return NextResponse.json({ message: "חובה לציין תאריך" }, { status: 400 });

    const selectedDate = new Date(dateStr);
    const dayOfWeek = format(selectedDate, 'EEEE').toUpperCase(); // למשל "MONDAY"

    // 1. נמצא את כל השיבוצים הקיימים באותו יום
    const existingPlacements = await prisma.placement.findMany({
      where: {
        date: {
          gte: new Date(selectedDate.setHours(0,0,0,0)),
          lte: new Date(selectedDate.setHours(23,59,59,999))
        },
        status: { not: "CANCELLED" }
      },
      select: { mainTeacherId: true, substituteId: true }
    });

    const busyMainTeachers = existingPlacements.map(p => p.mainTeacherId);
    const busySubstitutes = existingPlacements.map(p => p.substituteId).filter(Boolean);

    // 2. שליפת גננות אם (Managers) שיש להן גן ואין להן דיווח היום
    const availableManagers = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "MANAGER" },
        mainManagedInstitutions: { some: {} },
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
        roles: { has: "SUBSTITUTE" },
        workDays: { has: dayOfWeek as any }, // מוודא שזה יום עבודה שלהן
        id: { notIn: busySubstitutes as string[] }
      },
      select: { id: true, firstName: true, lastName: true }
    });

    return NextResponse.json({
      managers: availableManagers,
      substitutes: availableSubstitutes
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בסינון נתונים" }, { status: 500 });
  }
}