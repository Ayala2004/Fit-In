import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const createAbsenceReport = async (mainTeacherId: string, date: string) => {
  const absenceDate = new Date(date);
  // איפס שעות כדי להשוות תאריכים נטו
  absenceDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. מציאת גננת האם והמוסד שלה
  const teacher = await prisma.user.findUnique({
    where: { id: mainTeacherId },
    include: {
      institution: true // המוסד שבו היא עובדת כרגע
    }
  });

  if (!teacher || !teacher.institutionId || !teacher.institution) {
    throw new Error("גננת לא משויכת למוסד או שלא נמצאה");
  }

  const inst = teacher.institution;

  // 2. חישוב עדיפות (Priority)
  const diffTime = absenceDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const priority = diffDays <= 2 ? "URGENT" : "NORMAL";

  // 3. בדיקה האם כבר קיים דיווח ליום זה בגן הזה (למניעת כפילויות)
  const existingPlacement = await prisma.placement.findFirst({
    where: {
      institutionId: inst.id,
      date: absenceDate,
      status: { not: "CANCELLED" }
    }
  });

  if (existingPlacement) {
    throw new Error("כבר קיים דיווח היעדרות לתאריך זה בגן המבוקש");
  }

  // 4. יצירת ה-Placement
  const placement = await prisma.placement.create({
    data: {
      date: absenceDate,
      status: "OPEN",
      institutionId: inst.id,
      mainTeacherId: mainTeacherId,
      priority: priority,
    }
  });

  // 5. מציאת גננות פנויות (מחליפות ורוטציה)
  // לוגיקה: תפקיד מתאים + עובדת + אין לה שיבוץ אחר באותו יום
  const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"][absenceDate.getDay()];

  const availableSubstitutes = await prisma.user.findMany({
    where: {
      roles: { hasSome: ['SUBSTITUTE', 'ROTATION'] },
      isWorking: true,
      // אופציונלי: בדיקה אם היום הזה הוא ב-workDays שלהן
      // workDays: { has: dayOfWeek as any }, 
      placementsAsSub: {
        none: {
          date: absenceDate,
          status: "CLOSED"
        }
      }
    }
  });

  // 6. איסוף מקבלי התראות
  const recipientIds = new Set<string>();
  
  // מפקחת ומדריכה
  if (inst.instructorId) recipientIds.add(inst.instructorId);
  if (inst.supervisorId) recipientIds.add(inst.supervisorId);
  
  // כל המחליפות הפנויות
  availableSubstitutes.forEach(sub => recipientIds.add(sub.id));

  // 7. יצירת ההתראות
  const notificationTitle = priority === "URGENT" ? `🚨 קריאה דחופה: גן ${inst.name}` : `בקשה למילוי מקום: גן ${inst.name}`;
  const message = `דרושה מחליפה לתאריך ${absenceDate.toLocaleDateString('he-IL')}. גננת אם: ${teacher.firstName} ${teacher.lastName}`;

  const notificationData = Array.from(recipientIds).map(userId => ({
    userId,
    title: notificationTitle,
    message: message,
    type: priority === "URGENT" ? "URGENT_CALL" : "SYSTEM",
    status: "PENDING"
  }));

  if (notificationData.length > 0) {
    await prisma.notification.createMany({
      data: notificationData
    });
  }

  return placement;
};