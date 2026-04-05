import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay } from "date-fns";
import { Day } from "@prisma/client";
import { normalizeToMidday } from "@/services/placementService";

function getDayName(date: Date): Day {
  const days: Day[] = [
    Day.SUNDAY,
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
    Day.FRIDAY,
    Day.SATURDAY,
  ];
  return days[date.getDay()];
}

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUBSTITUTE")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    // 1. שליפת פרטי הגננת כדי לדעת מי המפקחת "האם" שלה
    const subProfile = await prisma.user.findUnique({
      where: { id: session.id },
      select: { supervisorId: true, workDays: true },
    });

    // 2. שליפת שיבוצים קיימים שלה (הלו"ז החודשי שלה)
    const mySchedule = await prisma.placement.findMany({
      where: { substituteId: session.id, status: "ASSIGNED" },
      include: {
        institution: true,
        mainTeacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "asc" },
    });

    // 3. שליפת כל הקריאות הפתוחות במערכת (מכל המחוזות)
    const openJobs = await prisma.placement.findMany({
      where: {
        status: "OPEN",
        date: { gte: normalizeToMidday(new Date()) },
      },
      include: {
        institution: {
          select: { name: true, address: true, supervisorId: true },
        },
        mainTeacher: { select: { firstName: true, lastName: true } },
      },
    });

    // 4. לוגיקת עדיפות: סימון ומיון
    const formattedJobs = openJobs
      .map((job) => ({
        ...job,
        isPriority: job.institution.supervisorId === subProfile?.supervisorId,
        matchesWorkDay: subProfile?.workDays.includes(
          getDayName(new Date(job.date)),
        ),
      }))
      .sort((a, b) => {
        // קודם עדיפות למחוז הבית, אחר כך לפי תאריך
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    return NextResponse.json({
      mySchedule,
      availableJobs: formattedJobs,
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
