import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    // בדיקת אבטחה נוספת גם בתוך ה-API
    if (!session || !session.roles.includes('SUPERVISOR')) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 });
    }

    // הבאת כל המדריכים שמשויכים למפקחת הזו + השיבוצים שלהם
    const instructors = await prisma.user.findMany({
      where: {
        supervisorId: session.id,
        roles: { has: 'INSTRUCTOR' }
      },
      include: {
        institution: true, // המוסד שבו הם משובצים
      }
    });

    return NextResponse.json(instructors);
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 });
  }
}