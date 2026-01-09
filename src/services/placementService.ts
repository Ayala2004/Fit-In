import { prisma } from "@/lib/prisma";
import {
  db_createNotification,
  db_notifyMultipleUsers,
} from "./notificationService";
import { Day } from "@prisma/client";
import { addMonths, startOfDay, endOfDay, addDays } from "date-fns";

const isSameDate = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * שליפת נתונים ללוח הבקרה של המפקחת
 */
export async function db_getSupervisorDashboard(supervisorId: string) {
  const today = startOfDay(new Date());
  const oneMonthFromNow = endOfDay(addMonths(new Date(), 1));

  const endOfWeek = endOfDay(addDays(today, 5));
  const orphanedManagers = await prisma.user.findMany({
    where: {
      supervisorId: supervisorId,
      isWorking: true, // רק גננות פעילות
      roles: { has: "MANAGER" }, // הן גננות אם
      NOT: {
        roles: { has: "INSTRUCTOR" }, // אבל לא מדריכות
      },
      OR: [
        { instructorId: null },
        { instructor: { isWorking: false } },
        {
          instructor: {
            NOT: {
              roles: { has: "INSTRUCTOR" },
            },
          },
        },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  // --- פונקציית עזר לחישוב דילוג שבת ---
  const getTargetDate = (startDate: Date, daysToCount: number) => {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < daysToCount) {
      currentDate = addDays(currentDate, 1);
      if (currentDate.getDay() !== 6) {
        addedDays++;
      }
    }
    return endOfDay(currentDate);
  };

  // 1. חישוב תאריך היעד לקריאות דחופות (3 ימי פעילות קדימה)
  const urgentDeadline = getTargetDate(today, 2);

  // 2. קריאות דחופות (מהיום ועד הדדליין הדחוף)
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

  // 3. בקשות פתוחות לשאר החודש (החל מהיום שאחרי הדדליין הדחוף)
  const openMonthlyRequests = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      status: "OPEN",
      date: {
        gt: urgentDeadline, // מעבר לטווח הדחוף
        lte: oneMonthFromNow, // עד בדיוק חודש מהיום
      },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  // 4. חוסרים מהעבר (Pending Updates - כאלו שקרו ולא טופלו)
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

  // 5. Snapshot שבועי (לצורך הגרף/תצוגה שבועית)
  const weeklyPlacements = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      date: { gte: today, lte: endOfWeek },
    },
    select: { date: true, status: true },
  });

  // 6. פעולות אחרונות (לפי זמן עדכון)
  const recentActivity = await prisma.placement.findMany({
    where: { institution: { supervisorId: supervisorId } },
    take: 5,
    orderBy: { updatedAt: "desc" },
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
    openMonthlyRequests,
    orphanedManagers,
  };
}

/**
 * שליפת היסטוריה מלאה לחודש ספציפי
 */
export async function db_getMonthlyHistory(
  supervisorId: string,
  month: number,
  year: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      updatedAt: {
        // אנחנו מסתכלים על מתי השינוי קרה
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
export async function db_getSupervisorIdByInstructor(instructorId: string) {
  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { supervisorId: true },
  });

  return instructor?.supervisorId || null;
}

/**
 * אימות תקינות שיבוץ
 */
export async function validatePlacement(substituteId: string, date: Date) {
  if (date.getDay() === 6) {
    throw new Error("אין פעילות גנים ביום שבת - לא ניתן לשבץ");
  }
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
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[date.getDay()] as Day;
};

/**
 * יצירת שיבוץ חדש
 */

// בדיקה מי אמורה להיות בגן ביום הזה לפי הלו"ז הקבוע

/**
 * יצירת דיווח היעדרות/שיבוץ חדש
 * תומך בדיווח של גננת אם, גננת רוטציה, או מפקחת (רטרואקטיבי)
 */
export async function db_createPlacement(data: {
  date: Date;
  institutionId: string;
  mainTeacherId: string;
  substituteId?: string | null;
  notes?: string;
  creatorRoles: string[];
  status?: "OPEN" | "ASSIGNED" | "CANCELLED";
}) {
  const targetDate = startOfDay(new Date(data.date));
  const today = startOfDay(new Date());

  // 1. בדיקות בסיסיות
  if (targetDate.getDay() === 6) throw new Error("לא ניתן לדווח בשבת");

  const isManager = (data.creatorRoles ?? []).some((r) =>
    ["SUPERVISOR", "INSTRUCTOR"].includes(r)
  );
  const isRetroactive = targetDate < today;

  if (isRetroactive && !isManager) {
    throw new Error("רק מפקחת או מדריכה יכולות לדווח על העבר");
  }

  // 2. מניעת כפילות
  const existing = await prisma.placement.findFirst({
    where: { institutionId: data.institutionId, date: targetDate },
  });
  if (existing) throw new Error("כבר קיים דיווח פעיל ליום זה בגן זה");

  // 3. קביעת סטטוס ועדיפות
  let finalStatus = data.status || "OPEN";
  if (isRetroactive && finalStatus === "OPEN") {
    throw new Error("בדיווח על העבר יש לבחור סטטוס סופי");
  }

  const diffInDays =
    (targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
  const priority = !isRetroactive && diffInDays <= 2 ? "URGENT" : "NORMAL";

  // 4. יצירת הרשומה
  const newPlacement = await prisma.placement.create({
    data: {
      date: targetDate,
      institutionId: data.institutionId,
      mainTeacherId: data.mainTeacherId, // מי שנעדרת בפועל
      substituteId: data.substituteId,
      notes: data.notes,
      status: finalStatus,
      priority: priority,
    },
    include: {
      institution: true,
      mainTeacher: {
        select: { firstName: true, lastName: true, supervisorId: true },
      },
      substitute: { select: { firstName: true, lastName: true } },
    },
  });

  // 5. התראות (רק לדיווחים עתידיים פתוחים)
  if (!isRetroactive && finalStatus === "OPEN") {
    const { institution, mainTeacher } = newPlacement;
    const notificationType =
      priority === "URGENT" ? "URGENT_CALL" : "STATUS_UPDATE";

    await db_createNotification({
      userId: institution.supervisorId,
      title: `היעדרות בגן ${institution.name}`,
      message: `הגננת ${
        mainTeacher.firstName
      } לא תגיע ביום ${targetDate.toLocaleDateString("he-IL")}`,
      type: notificationType,
    });

    const available = await prisma.user.findMany({
      where: {
        isWorking: true,
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: getDayEnum(targetDate) },
        placementsAsSub: { none: { date: targetDate, status: "ASSIGNED" } },
      },
      select: { id: true },
    });

    if (available.length > 0) {
      await db_notifyMultipleUsers(
        available.map((u) => u.id),
        priority === "URGENT" ? "קריאה דחופה!" : "הצעה להחלפה",
        `דרושה מחליפה לגן ${institution.name}`,
        notificationType
      );
    }
  }

  return newPlacement;
}

/**
 * שיבוץ ידני
 */
export async function db_manualAssign(
  placementId: string,
  substituteId: string,
  managerId: string
) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
  });
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
      // תיקון: אם הגן נסגר (CANCELLED) או הוחזר להמתנה (OPEN) - אנחנו מוחקים את המחליפה
      substituteId:
        params.newStatus === "CANCELLED" || params.newStatus === "OPEN"
          ? null
          : undefined,
    },
    include: { institution: true },
  });

  // שליחת התראה (נשאר כפי שכתבת)
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
/**

 * שליפת נתונים ללוח השנה הכוללת רוטציות קבועות ודיווחים ידניים
 */
export async function db_getCalendarData(
  month: number,
  year: number,
  supervisorId: string
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // אנחנו שולפים רק את טבלת Placement.
  // רשומה בטבלה הזו קיימת רק אם מישהי דיווחה על היעדרות (חריגה מהשגרה).
  return await prisma.placement.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      institution: { supervisorId: supervisorId },
    },
    include: {
      institution: {
        include: {
          // הוספנו את השליפה של גננת האם והרוטציות הקבועות שלה
          mainManager: {
            include: { fixedRotationsAsManager: true },
          },
        },
      },
      mainTeacher: {
        select: { id: true, firstName: true, lastName: true, roles: true },
      },
      substitute: {
        select: { id: true, firstName: true, lastName: true, roles: true },
      },
    },

    orderBy: {
      date: "asc",
    },
  });
}

/**
 * עדכון מהיר של שדה בשיבוץ (עריכה ישירה מהלוח)
 */
export async function db_quickUpdatePlacement(
  id: string,
  data: { mainTeacherId?: string; substituteId?: string; status?: any }
) {
  return await prisma.placement.update({
    where: { id },
    data,
    include: {
      institution: true,
      substitute: true,
      mainTeacher: true,
    },
  });
}
/**
 * אישור שיבוץ
 */
export async function db_assignSubstitute(
  placementId: string,
  substituteId: string
) {
  const updatedPlacement = await prisma.placement.update({
    where: { id: placementId },
    data: { substituteId, status: "ASSIGNED" },
    include: {
      institution: true,
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  const targets = [
    updatedPlacement.institution.supervisorId,
    updatedPlacement.institution.instructorId,
    updatedPlacement.mainTeacherId,
  ];
  for (const userId of targets) {
    await db_createNotification({
      userId,
      title: `שיבוץ נסגר: ${updatedPlacement.institution.name}`,
      message: `נמצאה מחליפה לתאריך ${updatedPlacement.date.toLocaleDateString(
        "he-IL"
      )}`,
      type: "STATUS_UPDATE",
    });
  }

  return updatedPlacement;
}




//פונקציות למדריכה

export async function db_getInstructorDashboard(instructorId: string) {
  const today = startOfDay(new Date());
  
  // 1. שליפת כל המוסדות שמשויכים למדריכה הזו
  const myInstitutions = await prisma.institution.findMany({
    where: { instructorId: instructorId },
    select: { id: true, name: true }
  });

  const institutionIds = myInstitutions.map(inst => inst.id);

  // 2. קריאות דחופות רק לגנים שלה
  const urgentAlerts = await prisma.placement.findMany({
    where: {
      institutionId: { in: institutionIds },
      status: "OPEN",
      date: { gte: today },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true, phoneNumber: true } },
    },
    orderBy: { date: "asc" },
  });

  // 3. פעילות אחרונה רק בגנים שלה
  const recentActivity = await prisma.placement.findMany({
    where: { institutionId: { in: institutionIds } },
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    urgentAlerts,
    recentActivity,
    myInstitutionsCount: institutionIds.length
  };
}