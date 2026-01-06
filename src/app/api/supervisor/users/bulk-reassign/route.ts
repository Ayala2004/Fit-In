import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const { managerIds, newInstructorId } = await req.json();

    if (!managerIds || !newInstructorId) {
      return NextResponse.json({ message: "נתונים חסרים" }, { status: 400 });
    }

    await prisma.user.updateMany({
      where: { id: { in: managerIds } },
      data: { instructorId: newInstructorId }
    });

    return NextResponse.json({ success: true, count: managerIds.length });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בעדכון המוני" }, { status: 500 });
  }
}