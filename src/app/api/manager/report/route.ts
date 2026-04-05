import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  db_createPlacement,
  normalizeToMidday,
} from "@/services/placementService";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const { date, notes } = await req.json();

    // מציאת המוסד
    const institution = await prisma.institution.findFirst({
      where: { mainManagerId: session.id },
    });

    if (!institution) throw new Error("לא נמצא מוסד משויך");

    // יצירת הדיווח (הפונקציה db_createPlacement כבר כוללת שליחת התראות למפקחת/מדריכה)
    const newPlacement = await db_createPlacement({
      date: normalizeToMidday(date),
      institutionId: institution.id,
      mainTeacherId: session.id,
      notes: notes,
      creatorRoles: session.roles,
      status: "OPEN",
    });

    return NextResponse.json(newPlacement);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
