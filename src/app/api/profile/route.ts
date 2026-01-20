import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/utils/crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        supervisor: { select: { firstName: true, lastName: true, phoneNumber: true } },
        instructor: { select: { firstName: true, lastName: true, phoneNumber: true } },
        managedInstitutions: { select: { name: true, address: true } },
      }
    });

    if (!user) return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });

    // הסרת הסיסמה ופענוח תעודת זהות
    const { password, ...safeUser } = user;
    return NextResponse.json({
      ...safeUser,
      idNumber: user.idNumber ? decrypt(user.idNumber) : "לא הוזן",
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const body = await req.json();
    const { firstName, lastName, phoneNumber, address } = body;

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: { firstName, lastName, phoneNumber, address }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בעדכון הפרטים" }, { status: 500 });
  }
}