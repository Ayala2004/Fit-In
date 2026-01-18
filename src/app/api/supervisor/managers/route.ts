// src/app/api/supervisor/managers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    // שינוי 1: אפשור גישה למפקחת או מדריכה
    if (
      !session ||
      (!session.roles.includes("SUPERVISOR") &&
        !session.roles.includes("INSTRUCTOR"))
    ) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    let targetSupervisorId = "";

    // שינוי 2: זיהוי מזהה המפקחת האחראית על המחוז
    if (session.roles.includes("SUPERVISOR")) {
      targetSupervisorId = session.id;
    } else {
      // אם זו מדריכה - נשלוף את ה-supervisorId מהפרופיל שלה
      const userProfile = await prisma.user.findUnique({
        where: { id: session.id },
        select: { supervisorId: true },
      });
      if (!userProfile?.supervisorId)
        return NextResponse.json(
          { message: "לא נמצא מחוז משויך" },
          { status: 400 },
        );
      targetSupervisorId = userProfile.supervisorId;
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    // שליפת גננות אם באותו מחוז

    const allManagers = await prisma.user.findMany({
      where: {
        roles: { has: "MANAGER" },
        isWorking: true,
        supervisorId: targetSupervisorId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        instructorId: true, 
        mainManagedInstitutions: { select: { id: true, name: true } },
      },
    });

    if (!dateStr)
      return NextResponse.json({ managers: allManagers, rotations: [] });

    const selectedDate = new Date(dateStr);
    const dayOfWeek = format(selectedDate, "EEEE").toUpperCase();

    // שליפת רוטציות
    const allRotations = await prisma.user.findMany({
      where: {
        roles: { has: "ROTATION" },
        isWorking: true,
        // רוטציות הן בדרך כלל כלל-מערכתיות או משויכות למפקחת
        OR: [{ supervisorId: targetSupervisorId }, { supervisorId: null }],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fixedRotationsAsRotation: {
          where: { day: dayOfWeek as any },
          include: {
            manager: {
              include: {
                mainManagedInstitutions: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      managers: allManagers,
      rotations: allRotations,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "שגיאה בטעינת נתונים" },
      { status: 500 },
    );
  }
}
