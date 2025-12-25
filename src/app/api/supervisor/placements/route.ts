import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    // שאילתה שמביאה את כל המדריכות של המפקחת הזו
    // ובתוך כל מדריכה - את הגננות שהיא מדריכה (דרך שדה instructorId)
    const instructors = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "INSTRUCTOR" },
      },
      include: {
        subordinatesIns: {
          // אלו הגננות שהמדריכה הזו אחראית עליהן
          include: {
            mainManagedInstitutions: true,
          },
        },
      },
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
