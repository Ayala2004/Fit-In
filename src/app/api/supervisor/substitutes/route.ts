// src/app/api/supervisor/substitutes/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Day } from "@prisma/client";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const absentTeacherId = searchParams.get("absentTeacherId"); // הוספנו פרמטר חדש

    const searchDate = new Date(dateParam!);
    const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][searchDate.getDay()];

    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // 1. מי שבאמת תפוסה בשיבוץ Placement "סגור" - היחידות שנסנן החוצה
    const busyInPlacements = await prisma.placement.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, status: "ASSIGNED" },
      select: { substituteId: true }
    });
    const busyIds = busyInPlacements.map(p => p.substituteId).filter(Boolean) as string[];

    // 2. שליפת כל המחליפות והרוטציות
    const subs = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        isWorking: true,
        id: { notIn: busyIds }
      },
      include: { fixedRotationsAsRotation: { where: { day: dayOfWeek as any } } }
    });

    let results = subs.map(s => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`,
      isDayOff: !s.workDays.includes(dayOfWeek as any),
      isFixedRotationToday: s.fixedRotationsAsRotation.length > 0
    }));

    // 3. תוספת מיוחדת: אם הנעדרת היא רוטציה, נמצא את גננת האם שלה ונוסיף אותה
    if (absentTeacherId) {
        const fixedRot = await prisma.fixedRotation.findFirst({
            where: { rotationTeacherId: absentTeacherId, day: dayOfWeek as any },
            include: { manager: true }
        });
        if (fixedRot && !busyIds.includes(fixedRot.managerId)) {
            results.unshift({
                id: fixedRot.managerId,
                label: `(גננת אם) ${fixedRot.manager.firstName} ${fixedRot.manager.lastName}`,
                isDayOff: false,
                isFixedRotationToday: false
            });
        }
    }

    return NextResponse.json(results);
  } catch (error) { return NextResponse.json({ error: "שגיאה" }, { status: 500 }); }
}