import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns'; 
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const today = new Date();

    const instructors = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: "INSTRUCTOR" },
      },
      include: {
        subordinatesIns: {
          include: {
            mainManagedInstitutions: true,
            // מביאים את השיבוצים של הגננת להיום בלבד
            placementsAsMain: {
              where: {
                date: {
                  gte: startOfDay(today),
                  lte: endOfDay(today),
                },
              },
            },
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