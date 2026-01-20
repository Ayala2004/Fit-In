import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes('ROTATION')) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    // 1. שליפת הלו"ז הקבוע (מאיזה גננות אם היא מקבלת ימי חופש)
    const fixedSchedule = await prisma.fixedRotation.findMany({
      where: { rotationTeacherId: session.id },
      include: {
        manager: {
          include: {
            mainManagedInstitutions: { select: { name: true, address: true, id: true } }
          }
        }
      }
    });

    // 2. שליפת שיבוצים עתידיים שבהם היא רשומה (או כנעדרת או כמחליפה)
    const placements = await prisma.placement.findMany({
      where: {
        OR: [
          { mainTeacherId: session.id },
          { substituteId: session.id }
        ],
        date: { gte: startOfDay(new Date()) }
      },
      include: {
        institution: { select: { name: true, address: true } },
        mainTeacher: { select: { firstName: true, lastName: true } },
        substitute: { select: { firstName: true, lastName: true } }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({
      fixedSchedule,
      placements
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}