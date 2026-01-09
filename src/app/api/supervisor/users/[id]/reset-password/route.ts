import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  // אבטחה: רק מפקחת מורשית לבצע איפוס
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // הצפנת הסיסמה החדשה (123456)
    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "הסיסמה אותחלה בהצלחה ל-123456" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "שגיאה באיפוס הסיסמה", details: error.message },
      { status: 500 }
    );
  }
}