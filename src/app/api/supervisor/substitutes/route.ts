import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Day } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // 1. חילוץ התאריך מה-URL
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: "חובה לציין תאריך" }, { status: 400 });
    }

    const searchDate = new Date(dateParam);
    
    // 2. המרת התאריך ליום בשבוע (Enum של Prisma)
    const daysMap: Day[] = [
      "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
    ];
    const dayOfWeek = daysMap[searchDate.getDay()];

    // הגדרת טווח התאריכים (מתחילת היום עד סופו) כדי לבדוק כפילות שיבוץ
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // 3. שאילתה חכמה ב-Prisma
    const substitutes = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        isWorking: true,
        // סינון 1: עובדת ביום הספציפי הזה בשבוע
        workDays: { has: dayOfWeek },
        // סינון 2: אין לה שיבוץ קיים בסטטוס ASSIGNED בתאריך הזה
        placementsAsSub: {
          none: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: "ASSIGNED"
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        workDays: true
      }
    });

    return NextResponse.json(substitutes);
  } catch (error) {
    console.error("Error fetching substitutes:", error);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}