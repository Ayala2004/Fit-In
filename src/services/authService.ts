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
    rotationTeacherId,
    ...rest
  } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);
  const encryptedID = encrypt(idNumber);

  // בדיקה לפי email במקום username
  const existing = await prisma.user.findUnique({
    where: { email: rest.email },
  });
  if (existing) throw new Error("אימייל זה כבר קיים במערכת");

  return await prisma.user.create({
    data: {
      ...rest,
      password: hashedPassword,
      idNumber: encryptedID,
      dateOfBirth: new Date(dateOfBirth),
      supervisorId: supervisorId || null,
      instructorId: instructorId || null,
      rotationTeacherId: rotationTeacherId || null,
    },
  });
}

export async function db_login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("אימייל או סיסמה שגויים");
  }

  const token = jwt.sign(
    { userId: user.id, roles: user.roles },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}
