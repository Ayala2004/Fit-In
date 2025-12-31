// src/app/api/supervisor/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/utils/crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // עדכון טיפוס הנתונים ל-Promise
) {
  const session = await getSession();

  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = await params; // חובה לעשות await ל-params ב-Next.js 15

    // 1. הוצאת שדות שאינם שדות פשוטים ב-Database
    const {
      id: _id,
      idNumber,
      instructorId,
      rotationTeacherId,
      username,
      permanentRotationId,
      instructor,
      supervisor,
      rotationTeacher,
      mainManagedInstitutions,
      managedInstitutions,
      instructedInstitutions,
      placementsAsMain,
      placementsAsSub,
      notifications,
      rotationForManagers,
      _count,
      ...otherFields
    } = body;

    // 2. הכנת אובייקט הנתונים לעדכון
    const updateData: any = { ...otherFields };

    // 3. טיפול ב-instructorId (MongoDB חייב ObjectId תקין או null)
    updateData.instructorId = (instructorId === "" || !instructorId) ? null : instructorId;

    // 4. טיפול ב-rotationTeacherId (MongoDB חייב ObjectId תקין או null)
    updateData.rotationTeacherId = (rotationTeacherId === "" || !rotationTeacherId) ? null : rotationTeacherId;

    // 5. טיפול בתעודת זהות (הצפנה)
    if (idNumber) {
      updateData.idNumber = encrypt(idNumber);
    }

    // 6. ביצוע העדכון בפועל
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Prisma Update Error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ message: "אימייל או תעודת זהות כבר קיימים במערכת" }, { status: 400 });
    }
    return NextResponse.json({ message: "שגיאת שרת פנימית בעדכון המשתמש" }, { status: 500 });
  }
}