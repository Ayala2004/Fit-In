import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/utils/crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = await params;

    // 1. פירוק השדות - אנחנו מוציאים כל מה שהוא לא שדה פשוט ב-User
    const {
      rotationData,
      idNumber,
      instructorId,
      instructor,
      supervisor,
      mainManagedInstitutions,
      managedInstitutions,
      instructedInstitutions,
      placementsAsMain,
      placementsAsSub,
      notifications,
      fixedRotationsAsManager,
      fixedRotationsAsRotation,
      _count,
      id: _id, // מוודאים שלא מעדכנים את ה-ID עצמו
      ...restOfFields
    } = body;

    // 2. הכנת אובייקט הנתונים לעדכון (רק שדות פשוטים)
    const updateData: any = {
      firstName: restOfFields.firstName,
      lastName: restOfFields.lastName,
      email: restOfFields.email,
      phoneNumber: restOfFields.phoneNumber,
      roles: restOfFields.roles,
      workDays: restOfFields.workDays,
      isWorking: restOfFields.isWorking,
      instructorId: instructorId || null,
    };

    // עדכון תאריך לידה אם קיים
    if (restOfFields.dateOfBirth) {
      updateData.dateOfBirth = new Date(restOfFields.dateOfBirth);
    }

    // הצפנת ת"ז אם נשלחה חדשה
    if (idNumber && idNumber.length > 5) {
      updateData.idNumber = encrypt(idNumber);
    }

    // 3. ביצוע העדכון בטבלת User
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    // 4. עדכון טבלת FixedRotation (רק אם היא MANAGER ושלחנו נתוני רוטציה)
    if (updatedUser.roles.includes("MANAGER") && rotationData) {
      // מחיקה של כל הרוטציות הקודמות של המשתמשת הזו
      await prisma.fixedRotation.deleteMany({
        where: { managerId: id }
      });

      // יצירת הרוטציות החדשות
      const rotationsToCreate = Object.entries(rotationData)
        .filter(([_, teacherId]) => teacherId && teacherId !== "")
        .map(([day, teacherId]) => ({
          managerId: id,
          day: day as any,
          rotationTeacherId: teacherId as string,
        }));

      if (rotationsToCreate.length > 0) {
        await prisma.fixedRotation.createMany({
          data: rotationsToCreate
        });
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Prisma Update Error Details:", error);
    return NextResponse.json(
      { message: "שגיאת שרת פנימית בעדכון", details: error.message },
      { status: 500 }
    );
  }
}