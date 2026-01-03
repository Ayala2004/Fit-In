import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { encrypt } from "../utils/crypto";
import { prisma } from "@/lib/prisma";

/**
 * רישום משתמשת חדשה במערכת
 * כולל טיפול בשיוכי רוטציה קבועים ועדכון לו"ז של הגננת המשלימה
 */
export async function db_registerUser(userData: any) {
  const {
    password,
    idNumber,
    dateOfBirth,
    supervisorId,
    instructorId,
    rotationData, // המידע על ימי הרוטציה { "TUESDAY": "teacher-id-123" }
    ...rest
  } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);
  const encryptedID = encrypt(idNumber);

  // 1. בדיקת אימייל קיים במערכת
  const existing = await prisma.user.findUnique({
    where: { email: rest.email },
  });
  if (existing) throw new Error("אימייל זה כבר קיים במערכת");

  // 2. יצירת המשתמשת החדשה (גננת האם / מדריכה)
  const newUser = await prisma.user.create({
    data: {
      firstName: rest.firstName,
      lastName: rest.lastName,
      email: rest.email,
      password: hashedPassword,
      idNumber: encryptedID,
      phoneNumber: rest.phoneNumber,
      dateOfBirth: new Date(dateOfBirth),
      roles: rest.roles,
      workDays: rest.workDays,
      supervisorId: supervisorId || null,
      instructorId: instructorId || null,
      isWorking: true,
    },
  });

  // 3. טיפול בשיבוצי רוטציה קבועים (רק אם המשתמשת היא MANAGER)
  if (rest.roles.includes("MANAGER") && rotationData) {
    const rotationEntries = Object.entries(rotationData).filter(([_, teacherId]) => teacherId && teacherId !== "");

    for (const [day, rotationTeacherId] of rotationEntries) {
      // א. יצירת רשומה בטבלת FixedRotation (החוזה הקבוע)
      // אנחנו משתמשים ב-create כי המשתמשת חדשה לגמרי
      await prisma.fixedRotation.create({
        data: {
          day: day as any,
          managerId: newUser.id,
          rotationTeacherId: rotationTeacherId as string,
        },
      });

      // ב. עדכון ימי העבודה של גננת הרוטציה
      // הגננת המשלימה חייבת שהיום הזה יופיע ב-workDays שלה כדי שתוכל להשתבץ
      const teacher = await prisma.user.findUnique({
        where: { id: rotationTeacherId as string },
        select: { workDays: true }
      });

      if (teacher && !teacher.workDays.includes(day as any)) {
        await prisma.user.update({
          where: { id: rotationTeacherId as string },
          data: {
            workDays: {
              set: [...teacher.workDays, day as any],
            },
          },
        });
      }
    }
  }

  return newUser;
}

/**
 * לוגין למערכת
 */
export async function db_login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("אימייל או סיסמה שגויים");
  }

  const token = jwt.sign(
    { id: user.id, roles: user.roles }, // שיניתי ל-id שיהיה תואם ל-auth.ts
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}