import { PrismaClient } from '@prisma/client';
import { decrypt, encrypt } from '../utils/crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 1. קבלת כל המשתמשים עם פענוח ת"ז
export async function db_getAllUsers() {
  const users = await prisma.user.findMany();
  return users.map(user => ({
    ...user,
    idNumber: user.idNumber ? decrypt(user.idNumber) : null,
    password: "PROTECTED"
  }));
}

// 2. קבלת משתמש לפי ID
export async function db_getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    idNumber: user.idNumber ? decrypt(user.idNumber) : null
  };
}

// 3. קבלת סטטיסטיקות/שיבוצים למשתמש לפי טווח תאריכים
// זה יענה על הצורך של ה-ADMIN לראות מתי גננת החליפה ובאילו גנים
export async function db_getUserStats(userId: string, startDate?: string, endDate?: string) {
  const whereClause: any = {
    OR: [{ mainTeacherId: userId }, { substituteId: userId }]
  };

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  return await prisma.placement.findMany({
    where: whereClause,
    include: { institution: true },
    orderBy: { date: 'asc' }
  });
}

// 4. קבלת התראות למשתמש
export async function db_getUserNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}