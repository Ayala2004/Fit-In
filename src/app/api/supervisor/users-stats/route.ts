// src/app/api/supervisor/users-stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/utils/crypto';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { supervisorId: session.id },
          // כולל מחליפות ורוטציה שמשויכות למחוז או כלליות
          { roles: { hasSome: ["SUBSTITUTE", "ROTATION"] } }
        ]
      },
      include: {
        mainManagedInstitutions: { select: { name: true } },
        instructor: { select: { firstName: true, lastName: true } }
      },
      orderBy: { firstName: 'asc' }
    });

    const decryptedUsers = users.map(u => ({
      ...u,
      // פענוח תעודת זהות לצורך הצגה למפקחת
      idNumber: u.idNumber ? decrypt(u.idNumber) : "לא הוזן",
      // המרת תאריך לפורמט שקלט HTML מבין (YYYY-MM-DD)
      dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : ""
    }));

    return NextResponse.json(decryptedUsers);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}