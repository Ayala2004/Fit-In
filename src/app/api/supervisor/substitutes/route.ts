import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // מציאת כל המחליפות והרוטציות שפעילות במערכת
    const substitutes = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        isWorking: true,
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