import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    // --- מקרה א': הקמת גן חדש (אין תאריך בבקשה) ---
    if (!dateStr) {
      const availableForNewInstitution = await prisma.user.findMany({
        where: {
          supervisorId: session.id,
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

    // 1. נמצא את כל האירועים הקיימים באותו יום ב-DB (Placements)
    const existingPlacements = await prisma.placement.findMany({
      where: {
        date: {
          gte: new Date(new Date(selectedDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(selectedDate).setHours(23, 59, 59, 999)),
        },
        // status: { not: "CANCELLED" }
      },
      select: { mainTeacherId: true, substituteId: true }
    });

    // רשימת גננות (אם או רוטציה) שכבר מדווח עליהן שהן חסרות היום
    const busyMainTeachers = existingPlacements.map((p) => p.mainTeacherId);
    
    // רשימת מחליפות שכבר תפוסות היום בשיבוץ חריג
    const busyAsSubInPlacements = existingPlacements.map((p) => p.substituteId).filter(Boolean) as string[];

    // 2. נמצא את כל גננות הרוטציה שתפוסות ביום הזה בלו"ז הקבוע (FixedRotation)
    const permanentlyBusyRotations = await prisma.fixedRotation.findMany({
      where: { day: dayOfWeek as any },
      select: { rotationTeacherId: true }
    });

    const busyInFixedRotation = permanentlyBusyRotations.map(r => r.rotationTeacherId);

    // איחוד כל ה-ID של מי שתפוסה היום כמחליפה (או חריג או קבוע)
    const allBusySubIds = [...busyAsSubInPlacements, ...busyInFixedRotation];

    // 3. שליפת גננות אם פנויות לדיווח (יש להן גן, והן לא דווחו כבר כחסרות היום)
    const availableManagers = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
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
        manager: { supervisorId: session.id },
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

    // 5. שליפת מחליפות פנויות (מי שעובדת היום, לא חסרה בעצמה, ולא תפוסה בשיבוץ אחר)
    const availableSubstitutes = await prisma.user.findMany({
      where: {
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: dayOfWeek as any },
        isWorking: true,
        id: { 
          notIn: [...allBusySubIds, ...busyMainTeachers] // לא תפוסה ולא חסרה
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