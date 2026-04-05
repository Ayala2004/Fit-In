import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/utils/crypto";
import { startOfDay } from "date-fns";
import { db_createNotification } from "@/services/notificationService";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: { subordinatesIns: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    const isNowWorking =
      body.isWorking !== undefined ? body.isWorking : currentUser.isWorking;
    const isInstructorRoleRemoved =
      currentUser.roles.includes("INSTRUCTOR") &&
      body.roles &&
      !body.roles.includes("INSTRUCTOR");
    // בדיקת המדריכה האחרונה
    if (isNowWorking === false || isInstructorRoleRemoved) {
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
                  "לא ניתן להשבית את המדריכה האחרונה במחוז כל עוד ישנן גננות אם.",
              },
              { status: 400 },
            );
          }
        }
      }
    }

    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phoneNumber !== undefined)
      updateData.phoneNumber = body.phoneNumber;
    if (body.roles !== undefined) updateData.roles = body.roles;
    if (body.workDays !== undefined) updateData.workDays = body.workDays;
    if (body.isWorking !== undefined) updateData.isWorking = body.isWorking;
    if (body.instructorId !== undefined) {
      updateData.instructorId =
        body.instructorId === "" || body.instructorId === "REMOVE"
          ? null
          : body.instructorId;
    }
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.idNumber && body.idNumber.length > 5)
      updateData.idNumber = encrypt(body.idNumber);

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    const today = startOfDay(new Date());

    if (updatedUser.isWorking === false) {
      // א. שחרור שיבוצים שבהם היא מחליפה
      const futureAssignments = await prisma.placement.findMany({
        where: { substituteId: id, date: { gte: today }, status: "ASSIGNED" },
        include: { institution: true },
      });

      for (const p of futureAssignments) {
        await prisma.placement.update({
          where: { id: p.id },
          data: { substituteId: null, status: "OPEN" },
        });
        const msg = `הגן ${p.institution.name} ב-${p.date.toLocaleDateString("he-IL")} חזר למצב ממתין כי המחליפה (${updatedUser.firstName}) הושבתה.`;
        await db_createNotification({
          userId: p.institution.supervisorId,
          title: "דרושה מחליפה (עדכון אוטומטי)",
          message: msg,
          type: "STATUS_UPDATE",
        });
      }

      // ב. מחיקת דיווחי היעדרות עתידיים שלה (גננת אם/רוטציה שחולה)
      // 2. טיפול בדיווחי היעדרות עתידיים שלה (Main Teacher) - מחיקת עתיד בלבד
      const futureAbsences = await prisma.placement.findMany({
        where: {
          mainTeacherId: id,
          date: { gte: today }, // רק מהיום והלאה
        },
        include: { institution: true },
      });

      if (futureAbsences.length > 0) {
        const datesStr = futureAbsences
          .map((p) => p.date.toLocaleDateString("he-IL"))
          .join(", ");

        const gardenName = futureAbsences[0].institution.name;

        // מחיקה פיזית של דיווחי העתיד
        await prisma.placement.deleteMany({
          where: {
            id: { in: futureAbsences.map((p) => p.id) },
          },
        });

        const msg = `שימי לב: עקב השבתת הגננת ${updatedUser.firstName}, נמחקו דיווחי ההיעדרות העתידיים שלה בגן ${gardenName} בתאריכים: ${datesStr}. דיווחי עבר נשמרו במערכת.`;

        await db_createNotification({
          userId: futureAbsences[0].institution.supervisorId,
          title: 'ניקוי לו"ז עקב השבתה',
          message: msg,
          type: "STATUS_UPDATE",
        });
      }
      // ג. מחיקת שיוכים קבועים
      await prisma.fixedRotation.deleteMany({
        where: { OR: [{ managerId: id }, { rotationTeacherId: id }] },
      });

      // ד. התראה על "מוסד יתום"
      if (updatedUser.roles.includes("MANAGER")) {
        const myInstitutions = await prisma.institution.findMany({
          where: { mainManagerId: id },
        });
        for (const inst of myInstitutions) {
          await db_createNotification({
            userId: inst.supervisorId,
            title: "נדרשת מנהלת לגן",
            message: `גננת האם של גן ${inst.name} הושבתה. יש לשבץ מנהלת חדשה דרך הדאשבורד.`,
            type: "URGENT_CALL",
          });
        }
      }
    } else if (body.workDays) {
      // טיפול בשינוי ימי עבודה
      const futureAssignments = await prisma.placement.findMany({
        where: { substituteId: id, date: { gte: today }, status: "ASSIGNED" },
        include: { institution: true },
      });

      for (const p of futureAssignments) {
        const days = [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ];
        const dayName = days[p.date.getDay()];
        if (!updatedUser.workDays.includes(dayName as any)) {
          await prisma.placement.update({
            where: { id: p.id },
            data: { substituteId: null, status: "OPEN" },
          });
          const msg = `שיבוץ בוטל ב${p.institution.name} (${p.date.toLocaleDateString("he-IL")}) - יום חופש חדש למחליפה.`;
          await db_createNotification({
            userId: p.institution.supervisorId,
            title: 'שיבוץ בוטל - שינוי לו"ז',
            message: msg,
            type: "STATUS_UPDATE",
          });
        }
      }
    }

    // עדכון רוטציות קבועות
    if (updatedUser.roles.includes("MANAGER") && body.rotationData) {
      await prisma.fixedRotation.deleteMany({
        where: { managerId: id, day: { in: updatedUser.workDays } },
      });
      const rotationsToCreate = [];
      for (const [day, teacherId] of Object.entries(body.rotationData)) {
        if (
          !teacherId ||
          teacherId === "REMOVE" ||
          teacherId === "" ||
          updatedUser.workDays.includes(day as any)
        )
          continue;
        rotationsToCreate.push({
          managerId: id,
          day: day as any,
          rotationTeacherId: teacherId as string,
        });
      }
      if (rotationsToCreate.length > 0) {
        await prisma.fixedRotation.deleteMany({
          where: { managerId: id, day: { notIn: updatedUser.workDays } },
        });
        await prisma.fixedRotation.createMany({ data: rotationsToCreate });
      }
    }

    // בדיקת יתומות
    let orphanedManagers: any[] = [];
    if (
      currentUser.isWorking &&
      currentUser.roles.includes("INSTRUCTOR") &&
      !updatedUser.isWorking
    ) {
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

    // בדיקת שבירת רוטציות
    let brokenRotations: any[] = [];
    if (updatedUser.roles.includes("ROTATION")) {
      brokenRotations = await prisma.fixedRotation.findMany({
        where: {
          rotationTeacherId: id,
          OR: [
            { manager: { isWorking: false } },
            { day: { notIn: updatedUser.workDays } },
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
    console.error("Update Error:", error);
    return NextResponse.json(
      { message: "שגיאת שרת פנימית", details: error.message },
      { status: 500 },
    );
  }
}
