import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes('MANAGER')) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const institution = await prisma.institution.findFirst({
      where: { mainManagerId: session.id },
      include: {
        supervisor: { select: { firstName: true, lastName: true, phoneNumber: true } },
        instructor: { select: { firstName: true, lastName: true, phoneNumber: true, email: true } },
      }
    });

    if (!institution) return NextResponse.json({ message: "לא נמצא גן" }, { status: 404 });

    // שליפת גננות הרוטציה הקבועות של המשתמשת הזו
    const userWithRotations = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
            fixedRotationsAsManager: {
                include: {
                    rotationTeacher: {
                        select: { firstName: true, lastName: true, phoneNumber: true }
                    }
                }
            }
        }
    });

    const placements = await prisma.placement.findMany({
      where: { institutionId: institution.id, date: { gte: startOfDay(new Date()) } },
      include: {
        mainTeacher: { select: { firstName: true, lastName: true } },
        substitute: { select: { firstName: true, lastName: true, phoneNumber: true } }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({
      institution,
      placements,
      rotations: userWithRotations?.fixedRotationsAsManager || []
    });
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}