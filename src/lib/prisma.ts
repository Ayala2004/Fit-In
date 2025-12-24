import { PrismaClient } from "@prisma/client";

// הגדרה שתמנע יצירת מופעים מרובים של Prisma ב-Development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // אופציונלי: מדפיס לטרמינל את השאילתות שנשלחות ל-DB
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;