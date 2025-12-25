import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Day } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  
  if (!dateStr) return NextResponse.json({ error: "חסר תאריך" }, { status: 400 });

  const date = new Date(dateStr);
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = days[date.getDay()] as Day;

  try {
    const substitutes = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        isWorking: true,
        workDays: { has: dayOfWeek },
        // בדיקה שהן לא משובצות כבר בסטטוס ASSIGNED בתאריך הזה
        placementsAsSub: {
          none: {
            date: {
              gte: new Date(date.setHours(0,0,0,0)),
              lte: new Date(date.setHours(23,59,59,999))
            },
            status: "ASSIGNED"
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true
      }
    });

    return NextResponse.json(substitutes);
  } catch (error) {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}