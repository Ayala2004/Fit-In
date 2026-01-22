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
    const { id } = await params;
    const body = await req.json();

    // 1. שליפת המשתמש הנוכחי מה-DB כבסיס להשוואה ומניעת קריסות
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { subordinatesIns: true }, 
    });

    if (!currentUser) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    // קביעת התפקידים שיהיו למשתמש לאחר העדכון (חדשים מהבקשה או הקיימים ב-DB)
    const effectiveRoles = body.roles || currentUser.roles;
    const isNowWorking = body.isWorking !== undefined ? body.isWorking : currentUser.isWorking;

    // בדיקת "המדריכה האחרונה"
    if (
      isNowWorking === false ||
      (body.roles && !body.roles.includes("INSTRUCTOR"))
    ) {
      if (currentUser.roles.includes("INSTRUCTOR")) {
        const activeInstructorsCount = await prisma.user.count({
          where: {
            supervisorId: session.id,
            roles: { has: "INSTRUCTOR" },
            isWorking: true,
            id: { not: id },
          },
        });

        if (activeInstructorsCount === 0) {
          const totalManagersInDistrict = await prisma.user.count({
            where: { supervisorId: session.id, roles: { has: "MANAGER" } },
          });

          if (totalManagersInDistrict > 0) {
            return NextResponse.json(
              {
                message:
                  "לא ניתן להשבית את המדריכה האחרונה במחוז כל עוד ישנן גננות אם. עלייך להגדיר מדריכה פעילה אחרת תחילה.",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 2. הכנת אובייקט הנתונים לעדכון (רק שדות שנשלחו ב-body)
    const updateData: any = {};
    
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
    if (body.roles !== undefined) updateData.roles = body.roles;
    if (body.workDays !== undefined) updateData.workDays = body.workDays;
    if (body.isWorking !== undefined) updateData.isWorking = body.isWorking;

    if (body.instructorId !== undefined) {
      updateData.instructorId = (body.instructorId === "" || body.instructorId === "REMOVE") ? null : body.instructorId;
    }

    if (body.dateOfBirth) {
      updateData.dateOfBirth = new Date(body.dateOfBirth);
    }

    if (body.idNumber && body.idNumber.length > 5) {
      updateData.idNumber = encrypt(body.idNumber);
    }

    // 3. ביצוע העדכון בטבלת User
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    // 4. טיפול ברוטציות במידה והגננת הושבתה
    if (updatedUser.isWorking === false && updatedUser.roles.includes("MANAGER")) {
      await prisma.fixedRotation.deleteMany({
        where: { managerId: id },
      });
    }
    // אם היא נשארה פעילה אבל נשלחו נתוני רוטציה חדשים
    else if (updatedUser.roles.includes("MANAGER") && body.rotationData) {
      const teacherIds = Object.values(body.rotationData).filter(
        (tid) => tid && tid !== "REMOVE" && tid !== ""
      ) as string[];

      const rotationTeachers = await prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, workDays: true, firstName: true },
      });

      const rotationsToCreate = [];
      for (const [day, teacherId] of Object.entries(body.rotationData)) {
        if (!teacherId || teacherId === "REMOVE" || teacherId === "") continue;
        const teacher = rotationTeachers.find((t) => t.id === teacherId);
        if (teacher && !teacher.workDays.includes(day as any)) continue;

        rotationsToCreate.push({
          managerId: id,
          day: day as any,
          rotationTeacherId: teacherId as string,
        });
      }

      await prisma.fixedRotation.deleteMany({ where: { managerId: id } });
      if (rotationsToCreate.length > 0) {
        await prisma.fixedRotation.createMany({ data: rotationsToCreate });
      }
    }

    // 5. בדיקה אם נוצרו "גננות יתומות" (אם המדריכה הפכה ללא פעילה)
    const wasActiveInstructor = currentUser.isWorking && currentUser.roles.includes("INSTRUCTOR");
    const isNowActiveInstructor = updatedUser.isWorking && updatedUser.roles.includes("INSTRUCTOR");
    
    let orphanedManagers: any[] = [];
    if (wasActiveInstructor && !isNowActiveInstructor) {
      orphanedManagers = await prisma.user.findMany({
        where: {
          instructorId: id,
          isWorking: true,
          id: { not: id },
          NOT: { roles: { has: "INSTRUCTOR" } },
        },
        select: { id: true, firstName: true, lastName: true },
      });
    }

    // 6. בדיקת שבירת רוטציות (אם גננת רוטציה שינתה ימי עבודה)
    let brokenRotations: any[] = [];
    if (updatedUser.roles.includes("ROTATION")) {
      brokenRotations = await prisma.fixedRotation.findMany({
        where: {
          rotationTeacherId: id,
          OR: [
            { manager: { isWorking: false } },
            { day: { notIn: updatedUser.workDays } },
            { rotationTeacher: { isWorking: false } },
          ],
        },
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (brokenRotations.length > 0) {
        await prisma.fixedRotation.deleteMany({
          where: { id: { in: brokenRotations.map((br) => br.id) } },
        });
      }
    }

    return NextResponse.json({
      user: updatedUser,
      needsReassignment: orphanedManagers.length > 0,
      orphanedManagers: orphanedManagers,
      needsRotationMigration: brokenRotations.length > 0,
      brokenRotations: brokenRotations,
    });

  } catch (error: any) {
    console.error("Prisma Update Error Details:", error);
    return NextResponse.json(
      { message: "שגיאת שרת פנימית בעדכון", details: error.message },
      { status: 500 }
    );
  }
}