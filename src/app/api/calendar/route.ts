// src/app/api/calendar/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay } from "date-fns";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  try {
    let targetSupervisorId = "";

    if (session.roles.includes("SUPERVISOR")) {
      // אם זו מפקחת - נשתמש ב-ID שלה
      targetSupervisorId = session.id;
    } else {
      // אם זו מדריכה - נשלוף את ה-supervisorId מהפרופיל שלה ב-DB
      const userProfile = await prisma.user.findUnique({
        where: { id: session.id },
        select: { supervisorId: true },
      });

      if (!userProfile?.supervisorId) {
        return NextResponse.json(
          { message: "לא נמצא מחוז משויך" },
          { status: 400 },
        );
      }
      targetSupervisorId = userProfile.supervisorId;
    }

    const startDate = new Date(year, month - 1, 1, 0, 0, 0); // תחילת החודש
    const endDate = new Date(year, month, 0, 23, 59, 59); // סוף החודש

    
    const placements = await prisma.placement.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        institution: { supervisorId: targetSupervisorId }, // כולם רואים את כל המחוז
      },
      include: {
        institution: {
          include: {
            mainManager: {
              include: { fixedRotationsAsManager: true },
            },
          },
        },
        mainTeacher: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            instructorId: true,
          },
        },
        substitute: { select: { firstName: true, lastName: true, id: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(placements);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  // בדיקת הרשאה
  if (
    !session ||
    (!session.roles.includes("SUPERVISOR") &&
      !session.roles.includes("INSTRUCTOR"))
  ) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  const { id } = await req.json();

  // בונוס: למנוע ממדריכה למחוק דיווח מהעבר
  const placement = await prisma.placement.findUnique({ where: { id } });
  const isPast =
    placement && startOfDay(new Date(placement.date)) < startOfDay(new Date());

  if (
    isPast &&
    !session.roles.includes("SUPERVISOR") &&
    !session.roles.includes("INSTRUCTOR")
  ) {
    return NextResponse.json(
      { message: "רק מפקחת יכולה למחוק דיווחים מהעבר" },
      { status: 403 },
    );
  }

  await prisma.placement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
