import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "הסיסמה הנוכחית שגויה" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.id },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({ message: "הסיסמה עודכנה בהצלחה" });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בעדכון הסיסמה" }, { status: 500 });
  }
}