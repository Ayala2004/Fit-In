import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    // שליפת כל המשתמשים שקשורים למפקחת הזו
    // כולל ספירה של שיבוצים כגננת אם (היעדרויות) וכמחליפה
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { supervisorId: session.id },
          { roles: { hasSome: ["SUBSTITUTE", "ROTATION"] } } // מחליפות הן בפורל הכללי
        ]
      },
      include: {
        _count: {
          select: {
            placementsAsMain: true, // כמה פעמים נעדרה
            placementsAsSub: true,  // כמה פעמים החליפה
          }
        },
        mainManagedInstitutions: { select: { name: true } }
      },
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בטעינת נתונים" }, { status: 500 });
  }
}