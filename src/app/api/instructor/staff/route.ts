import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  
  if (!session || !session.roles.includes("INSTRUCTOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const staff = await prisma.user.findMany({
      where: {
        instructorId: session.id,
        roles: { has: "MANAGER" }
      },
      include: {
        mainManagedInstitutions: {
          select: { name: true, institutionNumber: true }
        },
        fixedRotationsAsManager: {
          include: {
            rotationTeacher: {
              select: { firstName: true, lastName: true, phoneNumber: true }
            }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}