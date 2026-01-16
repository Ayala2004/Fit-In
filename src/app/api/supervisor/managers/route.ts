// src/app/api/supervisor/managers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) return NextResponse.json({ message: "חובה לציין תאריך" }, { status: 400 });

    const selectedDate = new Date(dateStr);
    const dayOfWeek = format(selectedDate, "EEEE").toUpperCase();

    // 1. שליפת כל גננות האם במערכת (ללא סינון)
    const allManagers = await prisma.user.findMany({
      where: {
        roles: { has: "MANAGER" },
        isWorking: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mainManagedInstitutions: { select: { id: true, name: true } },
      },
    });

    // 2. שליפת כל גננות הרוטציה במערכת (ללא סינון)
    // אנחנו מביאים גם את המידע על הגן שבו הן אמורות להיות היום בלו"ז הקבוע
    const allRotations = await prisma.user.findMany({
      where: {
        roles: { has: "ROTATION" },
        isWorking: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fixedRotationsAsRotation: {
            where: { day: dayOfWeek as any },
            include: {
                manager: {
                    include: { mainManagedInstitutions: { select: { id: true, name: true } } }
                }
            }
        }
      },
    });

    return NextResponse.json({
      managers: allManagers,
      rotations: allRotations,
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בטעינת נתונים" }, { status: 500 });
  }
}