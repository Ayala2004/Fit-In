import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

    // 1. נשלוף את כל ה-IDs של גננות שכבר מנהלות גן
    const institutions = await prisma.institution.findMany({
      select: { mainManagerId: true }
    });
    const assignedManagerIds = institutions.map(inst => inst.mainManagerId);

    // 2. נשלוף גננות אם ששייכות למפקחת ולא נמצאות ברשימה הנ"ל
    const availableManagers = await prisma.user.findMany({
      where: {
        roles: { has: "MANAGER" },
        supervisorId: session.id,
        id: { notIn: assignedManagerIds } // סינון גננות שכבר תפוסות
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        instructorId: true,
      }
    });

    return NextResponse.json(availableManagers);
  } catch (error) {
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}