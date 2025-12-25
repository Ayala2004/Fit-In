import { prisma } from "@/lib/prisma";
import {
  db_createNotification,
  db_notifyMultipleUsers,
} from "./notificationService";
import { Day } from "@prisma/client";

/**
 * אימות תקינות שיבוץ: בודק שהמחליפה פנויה והתאריך חוקי
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new Error("לא ניתן לשבץ לתאריך שכבר עבר");
  }

  return true;
}

/**
 * המרת תאריך ל-Enum של ימי השבוע
 */
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
 * יצירת שיבוץ חדש (דיווח על היעדרות) ושליחת התראות
 */
export async function db_createPlacement(data: {
  date: Date;
  institutionId: string;
  mainTeacherId: string;
  notes?: string;
  creatorRoles: string[];
  status?: "OPEN" | "ASSIGNED" | "CANCELLED";
}) {
  const targetDate = new Date(data.date);
  targetDate.setHours(0, 0, 0, 0); // איפוס שעות למניעת באגים של אזורי זמן

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isManager = (data.creatorRoles ?? []).some((role) =>
    ["SUPERVISOR", "INSTRUCTOR"].includes(role)
  );

  const isRetroactive = targetDate < today;

  // --- שלב הבדיקות (Validations) ---

  // 1. גננת אם מנסה לדווח על העבר
  if (isRetroactive && !isManager) {
    throw new Error("רק מפקחת או מדריכה יכולות לדווח על היעדרות רטרואקטיבית");
  }

  // 2. הגדרת סטטוס סופי לפי החוקים שלך
  let finalStatus: "OPEN" | "ASSIGNED" | "CANCELLED" = "OPEN";

  if (isRetroactive) {
    // מפקחת/מדריכה בעבר: חייבות ASSIGNED או CANCELLED
    if (data.status === "ASSIGNED" || data.status === "CANCELLED") {
      finalStatus = data.status;
    } else {
      throw new Error("בדיווח רטרואקטיבי יש לבחור סטטוס ASSIGNED או CANCELLED");
    }
  } else {
    // דיווח להיום/עתיד
    if (isManager) {
      // מפקחת/מדריכה יכולות לבחור הכל
      finalStatus = data.status || "OPEN";
    } else {
      // גננת אם יכולה רק OPEN
      finalStatus = "OPEN";
    }
  }

  // 3. הגנה מפני כפילויות
  const existingReport = await prisma.placement.findFirst({
    where: {
      institutionId: data.institutionId,
      date: targetDate,
      status: { not: "CANCELLED" } // מאפשר לדווח מחדש רק אם הדיווח הקודם בוטל
    }
  });
  if (existingReport) {
    throw new Error("כבר קיים דיווח פעיל לגן זה בתאריך שנבחר");
  }

  // --- שלב הביצוע ---

  const dayOfWeek = getDayEnum(targetDate);
  const diffInDays = (targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
  const priority = (!isRetroactive && diffInDays <= 2) ? "URGENT" : "NORMAL";

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


  // לוגיקת התראות - רק אם זה לא רטרואקטיבי
 if (!isRetroactive && finalStatus === "OPEN") {
    const { institution, mainTeacher } = newPlacement;
    const teacherName = `${mainTeacher.firstName} ${mainTeacher.lastName}`;

    const diffInDays =
      (targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    const isUrgent = diffInDays <= 2;
    const notificationType = isUrgent ? "URGENT_CALL" : "STATUS_UPDATE";

    await db_createNotification({
      userId: institution.supervisorId,
      title: `דיווח היעדרות: ${institution.name}`,
      message: `מפקחת יקרה, גננת האם ${teacherName} דיווחה על היעדרות לתאריך ${targetDate.toLocaleDateString(
        "he-IL"
      )}.`,
      type: notificationType,
    });

    await db_createNotification({
      userId: institution.instructorId,
      title: `צורך במחליפה: ${institution.name}`,
      message: `מדריכה יקרה, נפתחה קריאה לשיבוץ עבור ${teacherName} בתאריך ${targetDate.toLocaleDateString(
        "he-IL"
      )}.`,
      type: notificationType,
    });

    const availableTeachers = await prisma.user.findMany({
      where: {
        isWorking: true,
        roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
        workDays: { has: dayOfWeek },
        placementsAsSub: { none: { date: targetDate, status: "ASSIGNED" } },
      },
      select: { id: true },
    });

    const teacherIds = availableTeachers.map((t) => t.id);
    if (teacherIds.length > 0) {
      await db_notifyMultipleUsers(
        teacherIds,
        isUrgent ? "קריאה דחופה לשיבוץ!" : "הזדמנות לשיבוץ חדש",
        `דרושה מחליפה לגן ${
          institution.name
        } במקום ${teacherName} בתאריך ${targetDate.toLocaleDateString(
          "he-IL"
        )}`,
        notificationType
      );
    }
  }

  return newPlacement;
}

/**
 * שיבוץ ידני על ידי מנהלת
 */
export async function db_manualAssign(
  placementId: string,
  substituteId: string,
  managerId: string
) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    select: { date: true, status: true },
  });

  if (!placement) {
    throw new Error("השיבוץ לא נמצא");
  }
if (placement.status === "CANCELLED") {
    throw new Error("לא ניתן לשבץ מחליפה ליום שבו הגן הוגדר כסגור (CANCELLED)");
  }

  await validatePlacement(substituteId, placement.date);

  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  if (!manager?.roles.some((r) => ["SUPERVISOR", "INSTRUCTOR"].includes(r))) {
    throw new Error("רק מפקחת או מדריכה יכולות לבצע שיבוץ ידני");
  }

  return await db_assignSubstitute(placementId, substituteId);
}

/**
 * עדכון סטטוס של שיבוץ קיים (למשל ביטול גן ששובץ)
 */
export async function db_updatePlacementStatus(params: {
  placementId: string;
  newStatus: "OPEN" | "ASSIGNED" | "CANCELLED";
  managerId: string;
}) {
  //  בדיקת הרשאות (רק מפקחת או מדריכה)
  const manager = await prisma.user.findUnique({ where: { id: params.managerId } });
  if (!manager?.roles.some((r) => ["SUPERVISOR", "INSTRUCTOR"].includes(r))) {
    throw new Error("רק מפקחת או מדריכה יכולות לשנות סטטוס של שיבוץ קיים");
  }

  //  עדכון הסטטוס
  const updated = await prisma.placement.update({
    where: { id: params.placementId },
    data: { 
      status: params.newStatus,
      // אם זה ביטול, ננתק את המחליפה מהשיבוץ הזה
      substituteId: params.newStatus === "CANCELLED" ? null : undefined 
    },
    include: { institution: true }
  });

  //  התראה למפקחת על השינוי
const message = `סטטוס השיבוץ בגן ${updated.institution.name} עודכן ל-${params.newStatus}`;
  
  await db_createNotification({
    userId: updated.institution.supervisorId,
    title: "עדכון סטטוס שיבוץ",
    message,
    type: "STATUS_UPDATE"
  });
  //  התראה למדריכה על השינוי

  await db_createNotification({
    userId: updated.institution.instructorId,
    title: "עדכון סטטוס שיבוץ",
    message,
    type: "STATUS_UPDATE"
  });

  return updated;
}

/**
 * שליפת נתונים ללוח שנה
 */
export async function db_getCalendarData(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return await prisma.placement.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
      substitute: { select: { firstName: true, lastName: true } },
    },
  });
}

/**
 * אישור שיבוץ ושליחת התראה למפקחת
 */
export async function db_assignSubstitute(placementId: string, substituteId: string) {
  const updatedPlacement = await prisma.placement.update({
    where: { id: placementId },
    data: {
      substituteId: substituteId,
      status: "ASSIGNED",
    },
    include: {
      institution: true,
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { id: true, firstName: true, lastName: true } }, // הוספנו את המורה שנעדרת
    },
  });

  const subName = `${updatedPlacement.substitute?.firstName} ${updatedPlacement.substitute?.lastName}`;
  const message = `הגננת ${subName} שובצה בהצלחה לגן ${updatedPlacement.institution.name}.`;

  // 1. התראה למפקחת
  await db_createNotification({
    userId: updatedPlacement.institution.supervisorId,
    title: `שיבוץ נסגר: ${updatedPlacement.institution.name}`,
    message,
    type: "STATUS_UPDATE",
  });

  // 2. התראה למדריכה
  await db_createNotification({
    userId: updatedPlacement.institution.instructorId,
    title: `שיבוץ נסגר: ${updatedPlacement.institution.name}`,
    message,
    type: "STATUS_UPDATE",
  });

  // 3. תיקון: התראה לגננת האם (היא חייבת לדעת שיש לה מחליפה!)
  await db_createNotification({
    userId: updatedPlacement.mainTeacherId,
    title: `נמצאה לך מחליפה!`,
    message: `חדשות טובות, ${subName} תמלא את מקומך בתאריך ${updatedPlacement.date.toLocaleDateString("he-IL")}.`,
    type: "STATUS_UPDATE",
  });

  return updatedPlacement;
}
