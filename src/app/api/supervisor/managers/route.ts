// src/app/api/supervisor/managers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    
    // בדיקת הרשאה: מפקחת או מדריכה
    if (!session || (!session.roles.includes("SUPERVISOR") && !session.roles.includes("INSTRUCTOR"))) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    // --- לוגיקת זיהוי הקשר ---
    // אם זו מפקחת, הסינון הוא לפי ה-ID שלה.
    // אם זו מדריכה, הסינון עבור הגננות שלה הוא לפי instructorId, 
    // אבל עבור המחליפות במחוז היא צריכה את ה-supervisorId שלה.
    const isInstructor = session.roles.includes("INSTRUCTOR");
    const isSupervisor = session.roles.includes("SUPERVISOR");

    let districtSupervisorId = session.id;
    if (isInstructor) {
      const me = await prisma.user.findUnique({
        where: { id: session.id },
        select: { supervisorId: true }
      });
      districtSupervisorId = me?.supervisorId || session.id;
    }

    // פילטר בסיס לגננות: למפקחת - כל המחוז. למדריכה - רק הגננות שלה.
    const staffFilter = isSupervisor 
      ? { supervisorId: session.id } 
      : { instructorId: session.id };

    // --- מקרה א': הקמת גן חדש (אין תאריך בבקשה) ---
    if (!dateStr) {
      const availableForNewInstitution = await prisma.user.findMany({
        where: {
          ...staffFilter,
          roles: { has: "MANAGER" },
          mainManagedInstitutions: {
            none: {},
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          instructorId: true,
        },
      });

      return NextResponse.json(availableForNewInstitution);
    }

    // --- מקרה ב': דיווח יומי בלוח השנה (יש תאריך בבקשה) ---
    const selectedDate = new Date(dateStr);
    const dayOfWeek = format(selectedDate, "EEEE").toUpperCase();

    // 1. נמצא את כל האירועים הקיימים באותו יום ב-DB
    const existingPlacements = await prisma.placement.findMany({
      where: {
        date: {
          gte: new Date(new Date(selectedDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(selectedDate).setHours(23, 59, 59, 999)),
        },
      },
      select: { mainTeacherId: true, substituteId: true }
    });

    const busyMainTeachers = existingPlacements.map((p) => p.mainTeacherId);
    const busyAsSubInPlacements = existingPlacements.map((p) => p.substituteId).filter(Boolean) as string[];

    // 2. נמצא את כל גננות הרוטציה שתפוסות ביום הזה בלו"ז הקבוע
    const permanentlyBusyRotations = await prisma.fixedRotation.findMany({
      where: { day: dayOfWeek as any },
      select: { rotationTeacherId: true }
    });

    const busyInFixedRotation = permanentlyBusyRotations.map(r => r.rotationTeacherId);
    const allBusySubIds = [...busyAsSubInPlacements, ...busyInFixedRotation];

    // 3. שליפת גננות אם פנויות לדיווח (מסונן לפי תפקיד המשתמש המחובר)
    const availableManagers = await prisma.user.findMany({
      where: {
        ...staffFilter,
        roles: { has: "MANAGER" },
        mainManagedInstitutions: { some: {} },
        id: { notIn: busyMainTeachers },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mainManagedInstitutions: { select: { id: true, name: true } },
      },
    });

    // 4. שליפת גננות רוטציה שאמורות לעבוד היום (כדי לאפשר דיווח על היעדרותן)
    const activeRotations = await prisma.fixedRotation.findMany({
      where: {
        day: dayOfWeek as any,
        manager: staffFilter, // כאן הסינון הקריטי: רק רוטציות בגנים של המדריכה/מפקחת
        rotationTeacherId: { notIn: busyMainTeachers },
      },
      include: {
        rotationTeacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mainManagedInstitutions: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 5. שליפת מחליפות פנויות מהמחוז (districtSupervisorId)
    const availableSubstitutes = await prisma.user.findMany({
      where: {
        // מחליפות מוצגות לפי המחוז הכללי (מפקחת)
        OR: [
            { supervisorId: districtSupervisorId },
            { roles: { hasSome: ["SUBSTITUTE", "ROTATION"] } } // תמיכה במחליפות כלליות
        ],
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: dayOfWeek as any },
        isWorking: true,
        id: { 
          notIn: [...allBusySubIds, ...busyMainTeachers] 
        },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    return NextResponse.json({
      managers: availableManagers,
      rotations: activeRotations,
      substitutes: availableSubstitutes,
    });

  } catch (error) {
    console.error("Managers API Error:", error);
    return NextResponse.json(
      { message: "שגיאה בסינון נתונים" },
      { status: 500 }
    );
  }
}