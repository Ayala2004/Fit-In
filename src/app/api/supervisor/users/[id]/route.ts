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

    // בדיקת "המדריכה האחרונה"
    if (
      body.isWorking === false ||
      (body.roles && !body.roles.includes("INSTRUCTOR"))
    ) {
      // האם המשתמשת הזו היא מדריכה כרגע?
      const currentUser = await prisma.user.findUnique({
        where: { id },
        include: { subordinatesIns: true }, // גננות שמשויכות אליה
      });

      if (currentUser?.roles.includes("INSTRUCTOR")) {
        // כמה מדריכות פעילות אחרות נשארו למפקחת הזו?
        const activeInstructorsCount = await prisma.user.count({
          where: {
            supervisorId: session.id,
            roles: { has: "INSTRUCTOR" },
            isWorking: true,
            id: { not: id }, // לא לספור את זו שאנחנו עורכים
          },
        });

        // אם אין מדריכות אחרות אבל יש גננות במחוז
        if (activeInstructorsCount === 0) {
          // נבדוק אם יש בכלל גננות במחוז (של המפקחת הזו)
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
    // בדיקה: האם המשתמשת המעודכנת הפכה ללא פעילה או איבדה תפקיד מדריכה?

    const wasInstructor =
      body.roles?.includes("INSTRUCTOR") || body.roles.includes("INSTRUCTOR");
    const isNoLongerActiveInstructor =
      wasInstructor &&
      (updatedUser.isWorking === false ||
        !updatedUser.roles.includes("INSTRUCTOR"));
    // אם היא כבר לא מדריכה פעילה, נבדוק אם יש גננות שמשויכות אליה
    let orphanedManagers: any[] = [];

    // רק אם היא באמת הפסיקה להיות מדריכה, נחפש מי נשאר יתום תחתיה
    if (isNoLongerActiveInstructor) {
      orphanedManagers = await prisma.user.findMany({
        where: {
          instructorId: id,
          isWorking: true,
          id: { not: id }, // לא לכלול את עצמה
          NOT: {
            roles: { has: "INSTRUCTOR" },
          }, // גננות שהן לא מדריכות בעצמן
        },
        select: { id: true, firstName: true, lastName: true },
      });
    }

    return NextResponse.json({
      user: updatedUser,
      needsReassignment: orphanedManagers.length > 0,
      orphanedManagers: orphanedManagers,
    });
  } catch (error: any) {
    console.error("Prisma Update Error Details:", error);
    return NextResponse.json(
      { message: "שגיאת שרת פנימית בעדכון", details: error.message },
      { status: 500 }
    );
  }
}
