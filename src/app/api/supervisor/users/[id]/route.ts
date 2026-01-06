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
    if (
      updatedUser.isWorking === false &&
      updatedUser.roles.includes("MANAGER")
    ) {
      await prisma.fixedRotation.deleteMany({
        where: { managerId: id },
      });
      console.log(`Released all fixed rotations for inactive manager: ${id}`);
    }
    // אם היא נשארה פעילה אבל נשלחו נתוני רוטציה חדשים (הקוד הקיים שלך)
    else if (updatedUser.roles.includes("MANAGER") && rotationData) {
      // 1. שליפת כל גננות הרוטציה שמופיעות בבקשה
      const teacherIds = Object.values(rotationData).filter(
        (id) => id && id !== "REMOVE" && id !== ""
      ) as string[];

      const rotationTeachers = await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, workDays: true, firstName: true },
      });

      // 2. בניית מערך השיבוצים - רק בזיכרון (Memory) בינתיים
      const rotationsToCreate = [];

      for (const [day, teacherId] of Object.entries(rotationData)) {
        if (!teacherId || teacherId === "REMOVE" || teacherId === "") continue;

        const teacher = rotationTeachers.find((t) => t.id === teacherId);

        if (teacher && !teacher.workDays.includes(day as any)) {
          console.error(`Error: ${teacher.firstName} does not work on ${day}`);
          continue;
        }

        rotationsToCreate.push({
          managerId: id,
          day: day as any,
          rotationTeacherId: teacherId as string,
        });
      }

      // א. מוחקים את כל הרוטציות הקודמות של הגננת הזו
      await prisma.fixedRotation.deleteMany({ where: { managerId: id } });

      // ב. יוצרים את כל החדשות בבת אחת (רק אם יש כאלו)
      if (rotationsToCreate.length > 0) {
        await prisma.fixedRotation.createMany({
          data: rotationsToCreate,
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
