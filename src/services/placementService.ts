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
  // 1. בדיקה שהמחליפה לא עובדת כבר בגן אחר באותו יום (סטטוס ASSIGNED)
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

  // 2. בדיקה שהתאריך לא בעבר
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
 * יצירת שיבוץ חדש (דיווח על היעדרות) ושליחת התראות
 */
export async function db_createPlacement(data: {
  date: Date;
  institutionId: string;
  mainTeacherId: string;
  notes?: string;
}) {
  const dayOfWeek = getDayEnum(data.date);

  // 1. יצירת השיבוץ עם פרטי הגן ופרטי גננת האם
  const newPlacement = await prisma.placement.create({
    data: {
      ...data,
      status: "OPEN",
      priority:
        (new Date(data.date).getTime() - new Date().getTime()) /
          (1000 * 3600 * 24) <=
        2
          ? "URGENT"
          : "NORMAL",
    },
    include: {
      institution: true,
      mainTeacher: { select: { firstName: true, lastName: true } }, // שליפת השם
    },
  });

  const { institution, mainTeacher } = newPlacement;
  const teacherName = `${mainTeacher.firstName} ${mainTeacher.lastName}`;

  // 2. חישוב דחיפות
  const targetDate = new Date(data.date); // הבטחה שזה אובייקט תאריך
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffInTime = targetDate.getTime() - today.getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);
  console.log("diffInDays!!!-----=", diffInDays);
  // לוגיקה מתוקנת: אם התאריך רחוק (מעל יומיים) זה לא דחוף
  const isUrgent = diffInDays <= 2;
  const notificationType = isUrgent ? "URGENT_CALL" : "STATUS_UPDATE";
  today.setHours(0, 0, 0, 0);

  // 3. התראה למפקחת (עם שם הגננת)
  await db_createNotification({
    userId: institution.supervisorId,
    title: `דיווח היעדרות: ${institution.name}`,
    message: `מפקחת יקרה, הגננת ${teacherName} דיווחה על היעדרות לתאריך ${data.date.toLocaleDateString(
      "he-IL"
    )}.`,
    type: notificationType,
  });

  // 4. התראה למדריכה
  await db_createNotification({
    userId: institution.instructorId,
    title: `צורך במחליפה: ${institution.name}`,
    message: `מדריכה יקרה, נפתחה קריאה לשיבוץ עבור ${teacherName} בתאריך ${data.date.toLocaleDateString(
      "he-IL"
    )}.`,
    type: notificationType,
  });

  // 5. חיפוש מחליפות/רוטציה פנויות
  const availableTeachers = await prisma.user.findMany({
    where: {
      isWorking: true,
      roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
      workDays: { has: dayOfWeek },
      placementsAsSub: {
        none: { date: data.date, status: "ASSIGNED" },
      },
    },
    select: { id: true },
  });

  const teacherIds = availableTeachers.map((t) => t.id);

  // 6. שליחת התראה למחליפות עם סוג דחיפות דינמי
  if (teacherIds.length > 0) {
    await db_notifyMultipleUsers(
      teacherIds,
      isUrgent ? "קריאה דחופה לשיבוץ!" : "הזדמנות לשיבוץ חדש",
      `דרושה מחליפה לגן ${
        institution.name
      } במקום ${teacherName} בתאריך ${data.date.toLocaleDateString("he-IL")}`,
      notificationType
    );
  }

  return newPlacement;
}

/**
 * שיבוץ ידני על ידי מנהלת (מפקחת/מדריכה)
 */
export async function db_manualAssign(
  placementId: string,
  substituteId: string,
  managerId: string
) {
  // 1. שליפת פרטי השיבוץ כדי לקבל את התאריך
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    select: { date: true },
  });

  if (!placement) {
    throw new Error("השיבוץ לא נמצא");
  }

  // 2. אימות שהמחליפה פנויה בתאריך הזה
  await validatePlacement(substituteId, placement.date);

  // 3. בדיקת הרשאות המשבצת (חייבת להיות מפקחת או מדריכה)
  const manager = await prisma.user.findUnique({ where: { id: managerId } });
  if (!manager?.roles.some((r) => ["SUPERVISOR", "INSTRUCTOR"].includes(r))) {
    throw new Error("רק מפקחת או מדריכה יכולות לבצע שיבוץ ידני");
  }

  // 4. ביצוע השיבוץ בפועל
  return await db_assignSubstitute(placementId, substituteId);
}

/**
 * שליפת נתונים ללוח שנה לפי חודש ושנה
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

// אישור שיבוץ ושליחת התראה למפקחת

export async function db_assignSubstitute(
  placementId: string,
  substituteId: string
) {
  // 1. עדכון הסטטוס ל-ASSIGNED
  const updatedPlacement = await prisma.placement.update({
    where: { id: placementId },
    data: {
      substituteId: substituteId,
      status: "ASSIGNED",
    },
    include: {
      institution: true,
      substitute: { select: { firstName: true, lastName: true } },
    },
  });

  // 2. שליחת התראה למפקחת הגן
  await db_createNotification({
    userId: updatedPlacement.institution.supervisorId,
    title: `שיבוץ נסגר: ${updatedPlacement.institution.name}`,
    message: `הגננת ${updatedPlacement.substitute?.firstName} ${updatedPlacement.substitute?.lastName} שובצה בהצלחה.`,
    type: "STATUS_UPDATE",
  });

  return updatedPlacement;
}
