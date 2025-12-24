import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function db_createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: "URGENT_CALL" | "STATUS_UPDATE" | "SYSTEM";
}) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      status: "PENDING",
    },
  });
}

// פונקציה לשליחת התראה למספר משתמשים במקביל (למשל לכל המחליפות)
export async function db_notifyMultipleUsers(
  userIds: string[], 
  title: string, 
  message: string, 
  type: "URGENT_CALL" | "STATUS_UPDATE" | "SYSTEM" = "URGENT_CALL" // ברירת מחדל
) {
  const notifications = userIds.map(id => ({
    userId: id,
    title,
    message,
    type,
    status: "PENDING",
  }));

  return await prisma.notification.createMany({
    data: notifications,
  });
}