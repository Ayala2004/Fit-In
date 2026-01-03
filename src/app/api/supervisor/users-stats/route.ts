// src/app/api/supervisor/users-stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/utils/crypto";

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
          { roles: { hasSome: ["SUBSTITUTE", "ROTATION"] } }
        ]
      },
      include: {
        instructor: { select: { firstName: true, lastName: true } },
        // תיקון: הוספת הקשר שמראה מי גננות הרוטציה שרשומות תחת גננת האם הזו
        fixedRotationsAsManager: {
          include: {
            rotationTeacher: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        // הנתון הזה חשוב כדי לדעת מתי גננת רוטציה תפוסה במקום אחר
        fixedRotationsAsRotation: {
          select: {
            day: true,
            managerId: true
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    const decryptedUsers = users.map((u) => ({
      ...u,
      idNumber: u.idNumber ? decrypt(u.idNumber) : "לא הוזן",
      dateOfBirth: u.dateOfBirth
        ? new Date(u.dateOfBirth).toISOString().split("T")[0]
        : "",
    }));

    return NextResponse.json(decryptedUsers);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
