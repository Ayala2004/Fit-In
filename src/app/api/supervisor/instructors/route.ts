import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  const instructors = await prisma.user.findMany({
    where: {
      roles: { has: "INSTRUCTOR" },
      supervisorId: session.id, // חשוב להביא רק מדריכות ששייכות למפקחת הזו
      isWorking: true, // <-- להחזיר רק מדריכות פעילות
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isWorking: true, // <-- הוספנו את השדה הזה
    },
  });
  return NextResponse.json(instructors);
}
