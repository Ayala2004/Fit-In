import { prisma } from "@/lib/prisma";
import {
  db_createNotification,
  db_notifyMultipleUsers,
} from "./notificationService";
import { Day } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "date-fns";

/**
 * שליפת נתונים ללוח הבקרה של המפקחת
 */
export async function db_getSupervisorDashboard(supervisorId: string) {
  const today = startOfDay(new Date());
  const endOfWeek = endOfDay(addDays(today, 5));

  // --- פונקציית עזר לחישוב דילוג שבת ---
  const getTargetDate = (startDate: Date, daysToCount: number) => {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < daysToCount) {
      currentDate = addDays(currentDate, 1);
      if (currentDate.getDay() !== 6) { // 6 = יום שבת
        addedDays++;
      }
    }
    return endOfDay(currentDate);
  };

  // חישוב תאריך היעד לקריאות דחופות (3 ימי פעילות קדימה)
  const urgentDeadline = getTargetDate(today, 2);

  // 1. חוסרים מהעבר (Pending Updates)
  const pendingUpdates = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      status: "OPEN",
      date: { lt: today },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
  });

  // 2. קריאות דחופות (כולל דילוג שבת)
  const urgentAlerts = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      status: "OPEN",
      date: { gte: today, lte: urgentDeadline },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  // 3. Snapshot שבועי
  const weeklyPlacements = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      date: { gte: today, lte: endOfWeek },
    },
    select: { date: true, status: true },
  });

  // 4. פעולות אחרונות
  const recentActivity = await prisma.placement.findMany({
    where: { institution: { supervisorId: supervisorId } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    weeklyPlacements,
    urgentAlerts,
    pendingUpdates,
    recentActivity,
  };
}

/**
 * אימות תקינות שיבוץ
 */
export async function validatePlacement(substituteId: string, date: Date) {
  const existingPlacement = await prisma.placement.findFirst({
    where: {
      substituteId,
      date: date,
      status: "ASSIGNED",
    },
  });

  if (existingPlacement) {
    throw new Error("הגננת כבר משובצת לגן אחר בתאריך זה");
  }

  const today = startOfDay(new Date());
  if (date < today) {
    throw new Error("לא ניתן לשבץ לתאריך שכבר עבר");
  }

  return true;
}

const getDayEnum = (date: Date): Day => {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return days[date.getDay()] as Day;
};

/**
 * יצירת שיבוץ חדש
 */
export async function db_createPlacement(data: {
  date: Date;
  institutionId: string;
  mainTeacherId: string;
  notes?: string;
  creatorRoles: string[];
  status?: "OPEN" | "ASSIGNED" | "CANCELLED";
}) {
  const targetDate = startOfDay(new Date(data.date));
  const today = startOfDay(new Date());

  const isManager = (data.creatorRoles ?? []).some((role) =>
    ["SUPERVISOR", "INSTRUCTOR"].includes(role)
  );

  const isRetroactive = targetDate < today;

  if (isRetroactive && !isManager) {
    throw new Error("רק מפקחת או מדריכה יכולות לדווח על היעדרות רטרואקטיבית");
  }

  let finalStatus: "OPEN" | "ASSIGNED" | "CANCELLED" = "OPEN";
  if (isRetroactive) {
    if (data.status === "ASSIGNED" || data.status === "CANCELLED") {
      finalStatus = data.status;
    } else {
      throw new Error("בדיווח רטרואקטיבי יש לבחור סטטוס ASSIGNED או CANCELLED");
    }
  } else {
    finalStatus = isManager ? (data.status || "OPEN") : "OPEN";
  }

  const existingReport = await prisma.placement.findFirst({
    where: {
      institutionId: data.institutionId,
      date: targetDate,
      status: { not: "CANCELLED" },
    },
  });
  if (existingReport) throw new Error("כבר קיים דיווח פעיל לגן זה בתאריך שנבחר");

  const diffInDays = (targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
  const priority = !isRetroactive && diffInDays <= 2 ? "URGENT" : "NORMAL";

  const newPlacement = await prisma.placement.create({
    data: {
      date: targetDate,
      institutionId: data.institutionId,
      mainTeacherId: data.mainTeacherId,
      notes: data.notes,
      status: finalStatus,
      priority: priority,
    },
    include: {
      institution: true,
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  if (!isRetroactive && finalStatus === "OPEN") {
    const { institution, mainTeacher } = newPlacement;
    const teacherName = `${mainTeacher.firstName} ${mainTeacher.lastName}`;
    const notificationType = priority === "URGENT" ? "URGENT_CALL" : "STATUS_UPDATE";

    await db_createNotification({
      userId: institution.supervisorId,
      title: `דיווח היעדרות: ${institution.name}`,
      message: `גננת האם ${teacherName} דיווחה על היעדרות ל-${targetDate.toLocaleDateString("he-IL")}`,
      type: notificationType,
    });

    const availableTeachers = await prisma.user.findMany({
      where: {
        isWorking: true,
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: getDayEnum(targetDate) },
        placementsAsSub: { none: { date: targetDate, status: "ASSIGNED" } },
      },
      select: { id: true },
    });

    const teacherIds = availableTeachers.map((t) => t.id);
    if (teacherIds.length > 0) {
      await db_notifyMultipleUsers(
        teacherIds,
        priority === "URGENT" ? "קריאה דחופה לשיבוץ!" : "הזדמנות לשיבוץ חדש",
        `דרושה מחליפה לגן ${institution.name} בתאריך ${targetDate.toLocaleDateString("he-IL")}`,
        notificationType
      );
    }
  }

  return newPlacement;
}

/**
 * שיבוץ ידני
 */
export async function db_manualAssign(placementId: string, substituteId: string, managerId: string) {
  const placement = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!placement) throw new Error("השיבוץ לא נמצא");
  if (placement.status === "CANCELLED") throw new Error("הגן הוגדר כסגור");

  await validatePlacement(substituteId, placement.date);
  return await db_assignSubstitute(placementId, substituteId);
}

/**
 * שיבוץ עצמי
 */
export async function db_selfAssign(placementId: string, substituteId: string) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    select: { date: true, status: true },
  });

  if (!placement || placement.status !== "OPEN") {
    throw new Error("השיבוץ אינו זמין יותר");
  }

  await validatePlacement(substituteId, placement.date);
  return await db_assignSubstitute(placementId, substituteId);
}

/**
 * עדכון סטטוס
 */
export async function db_updatePlacementStatus(params: {
  placementId: string;
  newStatus: "OPEN" | "ASSIGNED" | "CANCELLED";
  managerId: string;
}) {
  const updated = await prisma.placement.update({
    where: { id: params.placementId },
    data: {
      status: params.newStatus,
      substituteId: params.newStatus === "CANCELLED" ? null : undefined,
    },
    include: { institution: true },
  });

  const message = `סטטוס הגן ${updated.institution.name} עודכן ל-${params.newStatus}`;
  await db_createNotification({
    userId: updated.institution.supervisorId,
    title: "עדכון סטטוס",
    message,
    type: "STATUS_UPDATE",
  });

  return updated;
}

/**
 * לוח שנה
 */
export async function db_getCalendarData(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return await prisma.placement.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
      substitute: { select: { firstName: true, lastName: true } },
    },
  });
}

/**
 * אישור שיבוץ
 */
export async function db_assignSubstitute(placementId: string, substituteId: string) {
  const updatedPlacement = await prisma.placement.update({
    where: { id: placementId },
    data: { substituteId, status: "ASSIGNED" },
    include: {
      institution: true,
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  const targets = [updatedPlacement.institution.supervisorId, updatedPlacement.institution.instructorId, updatedPlacement.mainTeacherId];
  for (const userId of targets) {
    await db_createNotification({
      userId,
      title: `שיבוץ נסגר: ${updatedPlacement.institution.name}`,
      message: `נמצאה מחליפה לתאריך ${updatedPlacement.date.toLocaleDateString("he-IL")}`,
      type: "STATUS_UPDATE",
    });
  }

  return updatedPlacement;
}