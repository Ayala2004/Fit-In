import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { encrypt } from "../utils/crypto";
import { prisma } from "@/lib/prisma";

export async function db_registerUser(userData: any) {
  const {
    password,
    idNumber,
    dateOfBirth,
    supervisorId,
    instructorId,
    ...rest
  } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);
  const encryptedID = encrypt(idNumber);
  const existing = await prisma.user.findUnique({
    where: { username: rest.username },
  });
  if (existing) throw new Error("שם משתמש כבר קיים");

  return await prisma.user.create({
    data: {
      ...rest,
      password: hashedPassword,
      idNumber: encryptedID,
      dateOfBirth: new Date(dateOfBirth),
      // הוספת ה-IDs של המנהלות אם קיימים
      supervisorId: supervisorId || null,
      instructorId: instructorId || null,
    },
  });
}

export async function db_login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("שם משתמש או סיסמה שגויים");
  }

  const token = jwt.sign(
    { userId: user.id, roles: user.roles },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}
