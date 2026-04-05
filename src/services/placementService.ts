import { prisma } from "@/lib/prisma";
import {
  db_createNotification,
  db_notifyMultipleUsers,
} from "./notificationService";
import { Day } from "@prisma/client";
import { addMonths, startOfDay, endOfDay, addDays } from "date-fns";

const isSameDate = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// פונקציה פנימית לבדיקה האם גננת תפוסה ברוטציה קבועה בגן אחר
async function isBusyInFixedRotation(
  userId: string,
  date: Date,
  currentInstitutionId: string,
) {
  const daysArray = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayName = daysArray[date.getDay()];

  const fixed = await prisma.fixedRotation.findFirst({
    where: {
      rotationTeacherId: userId,
      day: dayName as any,
      // אנחנו בודקים אם היא תפוסה בגן *אחר* (לא הגן הנוכחי שבו היא ממילא עובדת)
      manager: {
        mainManagedInstitutions: {
          none: { id: currentInstitutionId },
        },
      },
    },
    include: {
      manager: { include: { mainManagedInstitutions: true } },
    },
  });

  return fixed;
}
/**
 * שליפת נתונים ללוח הבקרה של המפקחת
 */
export async function db_getSupervisorDashboard(supervisorId: string) {
  const today = startOfDay(new Date());
  const oneMonthFromNow = endOfDay(addMonths(new Date(), 1));

  const endOfWeek = endOfDay(addDays(today, 5));
  const orphanedManagers = await prisma.user.findMany({
    where: {
      supervisorId: supervisorId,
      isWorking: true, // רק גננות פעילות
      roles: { has: "MANAGER" }, // הן גננות אם
      NOT: {
        roles: { has: "INSTRUCTOR" }, // אבל לא מדריכות
      },
      OR: [
        { instructorId: null },
        { instructor: { isWorking: false } },
        {
          instructor: {
            NOT: {
              roles: { has: "INSTRUCTOR" },
            },
          },
        },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  // --- פונקציית עזר לחישוב דילוג שבת ---
  const getTargetDate = (startDate: Date, daysToCount: number) => {
    let currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < daysToCount) {
      currentDate = addDays(currentDate, 1);
      if (currentDate.getDay() !== 6) {
        addedDays++;
      }
    }
    return endOfDay(currentDate);
  };

  // 1. חישוב תאריך היעד לקריאות דחופות (3 ימי פעילות קדימה)
  const urgentDeadline = getTargetDate(today, 2);

  // 2. קריאות דחופות (מהיום ועד הדדליין הדחוף)
  const urgentAlerts = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId, isActive: true },
      status: "OPEN",
      date: { gte: today, lte: urgentDeadline },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  // גנים שהמנהלת שלהם מושבתת (דורשים טיפול דחוף בשיבוץ מנהלת)
  const orphanedInstitutions = await prisma.institution.findMany({
    where: {
      supervisorId: supervisorId,
      isActive: true,
      mainManager: { isWorking: false },
    },
    include: {
      mainManager: { select: { firstName: true, lastName: true } },
    },
  });

  // 3. בקשות פתוחות לשאר החודש (החל מהיום שאחרי הדדליין הדחוף)
  const openMonthlyRequests = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId, isActive: true },
      status: "OPEN",
      date: {
        gt: urgentDeadline, // מעבר לטווח הדחוף
        lte: oneMonthFromNow, // עד בדיוק חודש מהיום
      },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  // 4. חוסרים מהעבר (Pending Updates - כאלו שקרו ולא טופלו)
  const pendingUpdates = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId, isActive: true },
      status: "OPEN",
      date: { lt: today },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
  });

  // 5. Snapshot שבועי (לצורך הגרף/תצוגה שבועית)
  const weeklyPlacements = await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      date: { gte: today, lte: endOfWeek },
    },
    select: { date: true, status: true },
  });

  // 6. פעולות אחרונות (לפי זמן עדכון)
  const recentActivity = await prisma.placement.findMany({
    where: { institution: { supervisorId: supervisorId } },
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    weeklyPlacements,
    urgentAlerts,
    pendingUpdates,
    recentActivity,
    openMonthlyRequests,
    orphanedManagers,
    orphanedInstitutions,
  };
}

/**
 * שליפת היסטוריה מלאה לחודש ספציפי
 */
export async function db_getMonthlyHistory(
  supervisorId: string,
  month: number,
  year: number,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await prisma.placement.findMany({
    where: {
      institution: { supervisorId: supervisorId },
      updatedAt: {
        // אנחנו מסתכלים על מתי השינוי קרה
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function db_getSupervisorIdByInstructor(instructorId: string) {
  const instructor = await prisma.user.findUnique({
    where: { id: instructorId },
    select: { supervisorId: true },
  });

  return instructor?.supervisorId || null;
}

/**
 * אימות תקינות שיבוץ
 */
export async function validatePlacement(substituteId: string, date: Date) {
  if (date.getDay() === 6) {
    throw new Error("אין פעילות גנים ביום שבת - לא ניתן לשבץ");
  }
  const existingPlacement = await prisma.placement.findFirst({
    where: {
      substituteId,
      date: date,
      status: "ASSIGNED",
    },
  });

  if (existingPlacement) {
    throw new Error("הגננת כבר משובצת לגן אחר בתאריך זה");
  }

  const today = startOfDay(new Date());
  if (date < today) {
    throw new Error("לא ניתן לשבץ לתאריך שכבר עבר");
  }

  return true;
}

const getDayEnum = (date: Date): Day => {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[date.getDay()] as Day;
};

/**
 * יצירת דיווח היעדרות/שיבוץ חדש
 * תומך בדיווח של גננת אם, גננת רוטציה, או מפקחת (רטרואקטיבי)
 */

// export async function db_createPlacement(data: any) {
//    const targetDate = startOfDay(new Date(data.date));
//   const institutionId = data.institutionId;

//   // 1. בדיקה: האם המחליפה (אם נשלחה) תפוסה בלו"ז קבוע במקום אחר?
//   if (data.substituteId) {
//     const fixedConflict = await isBusyInFixedRotation(data.substituteId, targetDate, institutionId);
//     if (fixedConflict) {
//       const otherGarden = fixedConflict.manager.mainManagedInstitutions[0]?.name || "אחר";
//       throw new Error(`לא ניתן לשבץ את המחליפה: בתאריך זה היא משובצת קבוע בגן "${otherGarden}".`);
//     }
//   }

//   // 2. בדיקה: האם הנעדרת עצמה (mainTeacherId) בכלל אמורה להיות במקום אחר כמחליפה קבועה?
//   // (זה המקרה של גננת רוטציה שמדווחת על מחלה ביום שהיא בכלל תפוסה בגן אחר)
//   const mainTeacherFixedConflict = await isBusyInFixedRotation(data.mainTeacherId, targetDate, institutionId);
//   if (mainTeacherFixedConflict) {
//      const otherGarden = mainTeacherFixedConflict.manager.mainManagedInstitutions[0]?.name || "אחר";
//      throw new Error(`דיווח שגוי: הגננת רשומה כרוטציה קבועה בגן "${otherGarden}" ביום זה.`);
//   }

//   // 1. בדיקה האם הגננת שרוצים לדווח עליה (mainTeacherId) תפוסה כבר בתפקיד כלשהו
//   const existingPlacementForTeacher = await prisma.placement.findFirst({
//     where: {
//       date: targetDate,
//       OR: [
//         { mainTeacherId: data.mainTeacherId },
//         { substituteId: data.mainTeacherId },
//       ],
//     },
//     include: {
//       institution: { select: { name: true } },
//     },
//   });
//   if (existingPlacementForTeacher) {
//     const garden = existingPlacementForTeacher.institution.name;
//     throw new Error(
//       `כבר קיים דיווח במערכת עבור גננת זו בתאריך המבוקש (גן ${garden}). במידה והגן סגור וברצונך לפתוח אותו, יש לעדכן את הסטטוס בלוח השנה.`,
//     );
//   }
//   // if (existingPlacementForTeacher) {
//   //   const role =
//   //     existingPlacementForTeacher.mainTeacherId === data.mainTeacherId
//   //       ? "כנעדרת"
//   //       : "כמחליפה";
//   //   const garden = existingPlacementForTeacher.institution.name;
//   //   throw new Error(
//   //     `לא ניתן ליצור דיווח: הגננת כבר רשומה במערכת ${role} בגן "${garden}" בתאריך זה.`,
//   //   );
//   // }

//   // 2. בדיקה נוספת: אם המפקחת יוצרת שיבוץ ומיד מוסיפה מחליפה (substituteId)
//   // צריך לוודא שגם המחליפה לא תפוסה כבר באותו יום
//   if (data.substituteId) {
//     const existingForSubstitute = await prisma.placement.findFirst({
//       where: {
//         date: targetDate,
//         status: { not: "CANCELLED" },
//         OR: [
//           { mainTeacherId: data.substituteId }, // האם המחליפה עצמה חולה/נעדרת באותו יום?
//           { substituteId: data.substituteId }, // האם היא כבר מחליפה בגן אחר?
//         ],
//       },
//       include: {
//         institution: { select: { name: true } },
//       },
//     });

//     if (existingForSubstitute) {
//       throw new Error(
//         `לא ניתן לשבץ מחליפה זו: היא כבר רשומה במערכת בתאריך זה בגן "${existingForSubstitute.institution.name}".`,
//       );
//     }
//   }
//   // 1. יצירת הרשומה
//   const newPlacement = await prisma.placement.create({
//     data: {
//       date: targetDate,
//       institutionId: data.institutionId,
//       mainTeacherId: data.mainTeacherId,
//       substituteId: data.substituteId,
//       notes: data.notes,
//       status: data.status || "OPEN",
//     },
//     include: {
//       institution: true,
//       mainTeacher: {
//         select: { firstName: true, lastName: true, phoneNumber: true },
//       },
//       substitute: { select: { firstName: true, lastName: true } },
//     },
//   });

//   const { institution, mainTeacher, substitute, status } = newPlacement;
//   const dateStr = targetDate.toLocaleDateString("he-IL");
//   const mainName = `${mainTeacher.firstName} ${mainTeacher.lastName}`;
//   const subName = substitute
//     ? `${substitute.firstName} ${substitute.lastName}`
//     : undefined;

//   // --- שליחת התראות ---

//   if (status === "ASSIGNED" && substitute) {
//     // מפקחת
//     if (!data.creatorRoles.includes("SUPERVISOR")) {
//       await db_createNotification({
//         userId: institution.supervisorId,
//         title: "שיבוץ אוייש",
//         message: formatMessage({
//           prefix: "מפקחת יקרה",
//           statusText: "שיבוץ נסגר",
//           gardenName: institution.name,
//           address: institution.address,
//           mainName,
//           subName,
//           date: dateStr,
//         }),
//         type: "STATUS_UPDATE",
//       });
//     }
//     // מדריכה
//     if (institution.instructorId && !data.creatorRoles.includes("INSTRUCTOR")) {
//       await db_createNotification({
//         userId: institution.instructorId,
//         title: "שיבוץ אוייש",
//         message: formatMessage({
//           prefix: "מדריכה יקרה",
//           statusText: "שיבוץ נסגר",
//           gardenName: institution.name,
//           address: institution.address,
//           mainName,
//           subName,
//           date: dateStr,
//         }),
//         type: "STATUS_UPDATE",
//       });
//     }
//     // גננת אם
//     await db_createNotification({
//       userId: data.mainTeacherId,
//       title: "נמצאה מחליפה",
//       message: formatMessage({
//         prefix: "גננת אם יקרה",
//         statusText: "נמצאה עבורך מחליפה",
//         gardenName: institution.name,
//         address: institution.address,
//         mainName,
//         subName,
//         date: dateStr,
//       }),
//       type: "STATUS_UPDATE",
//     });
//     // למחליפה
//     await db_createNotification({
//       userId: data.substituteId!,
//       title: "שיבוץ חדש עבורך",
//       message: formatMessage({
//         prefix: "גננת יקרה",
//         statusText: "שובצת להחלפה",
//         gardenName: institution.name,
//         address: institution.address,
//         mainName,
//         subName,
//         date: dateStr,
//       }),
//       type: "STATUS_UPDATE",
//     });
//   } else if (status === "OPEN") {
//     // 1. התראה למפקחת (אלא אם היא יצרה את הדיווח)
//     if (!data.creatorRoles.includes("SUPERVISOR")) {
//       await db_createNotification({
//         userId: institution.supervisorId,
//         title: "דרושה מחליפה",
//         message: formatMessage({
//           prefix: "מפקחת יקרה",
//           statusText: "דווחה היעדרות (ממתין למחליפה)",
//           gardenName: institution.name,
//           address: institution.address,
//           mainName,
//           date: dateStr,
//         }),
//         type: "STATUS_UPDATE",
//       });
//     }
//     if (institution.instructorId && !data.creatorRoles.includes("INSTRUCTOR")) {
//       await db_createNotification({
//         userId: institution.instructorId,
//         title: "דרושה מחליפה",
//         message: formatMessage({
//           prefix: "מדריכה יקרה",
//           statusText: "דווחה היעדרות (ממתין למחליפה)",
//           gardenName: institution.name,
//           address: institution.address,
//           mainName,
//           date: dateStr,
//         }),
//         type: "STATUS_UPDATE",
//       });
//     }

//     // קריאה למחליפות
//     const notifyIds = await getAvailableForNotification(targetDate);
//     if (notifyIds.length > 0) {
//       await db_notifyMultipleUsers(
//         notifyIds,
//         "הזדמנות להחלפה",
//         formatMessage({
//           prefix: "גננת  מחליפה יקרה",
//           statusText: "יש לך הזדמנות להחליף",
//           gardenName: institution.name,
//           address: institution.address,
//           mainName,
//           date: dateStr,
//         }),
//         "URGENT_CALL",
//       );
//     }
//   }

//   return newPlacement;
// }

type CreatePlacementInput = {
  date: any;
  institutionId: string;
  mainTeacherId: string;
  substituteId?: string;
  notes?: string;
  status?: "OPEN" | "ASSIGNED" | "CANCELLED";
  creatorRoles: string[];
};

export async function db_createPlacement(data: CreatePlacementInput) {
  const targetDate = startOfDay(new Date(data.date));

  return await prisma.$transaction(async (tx) => {
    // ---------- helpers ----------
    async function isUserBusy(userId: string) {
      return tx.placement.findFirst({
        where: {
          date: targetDate,
          status: { not: "CANCELLED" },
          OR: [{ mainTeacherId: userId }, { substituteId: userId }],
        },
        include: {
          institution: { select: { name: true } },
        },
      });
    }

    async function handlePlacementNotifications({
      tx,
      data,
      institution,
      status,
      mainName,
      subName,
      dateStr,
      targetDate,
    }: any) {
      if (status === "ASSIGNED" && subName) {
        if (!data.creatorRoles.includes("SUPERVISOR")) {
          // חובה await
          await db_createNotification({
            userId: institution.supervisorId,
            title: "שיבוץ אוייש",
            message: `${mainName} שובצה עם מחליפה (${subName}) בגן ${institution.name} בתאריך ${dateStr}`,
            type: "STATUS_UPDATE",
          });
        }

        if (
          institution.instructorId &&
          !data.creatorRoles.includes("INSTRUCTOR")
        ) {
          await db_createNotification({
            userId: institution.instructorId,
            title: "שיבוץ אוייש",
            message: `${mainName} שובצה עם מחליפה בגן ${institution.name} בתאריך ${dateStr}`,
            type: "STATUS_UPDATE",
          });
        }

        await db_createNotification({
          userId: data.mainTeacherId,
          title: "נמצאה מחליפה",
          message: `גננת אם יקרה, נמצאה עבורך מחליפה (${subName}) לתאריך ${dateStr}`,
          type: "STATUS_UPDATE",
        });

        await db_createNotification({
          userId: data.substituteId!,
          title: "שיבוץ חדש",
          message: `גננת יקרה, שובצת להחלפה בגן ${institution.name} בתאריך ${dateStr}`,
          type: "STATUS_UPDATE",
        });
      }

      if (status === "OPEN") {
        if (!data.creatorRoles.includes("SUPERVISOR")) {
          await db_createNotification({
            userId: institution.supervisorId,
            title: "דרושה מחליפה",
            message: `דווחה היעדרות בגן ${institution.name} בתאריך ${dateStr}`,
            type: "STATUS_UPDATE",
          });
        }

        if (
          institution.instructorId &&
          !data.creatorRoles.includes("INSTRUCTOR")
        ) {
          await db_createNotification({
            userId: institution.instructorId,
            title: "דרושה מחליפה",
            message: `יש צורך במחליפה בגן ${institution.name} בתאריך ${dateStr}`,
            type: "STATUS_UPDATE",
          });
        }

        const notifyIds = await getAvailableForNotification(targetDate);
        if (notifyIds.length > 0) {
          await db_notifyMultipleUsers(
            notifyIds,
            "הזדמנות להחלפה",
            `יש הזדמנות להחלפה בגן ${institution.name} בתאריך ${dateStr}`,
            "URGENT_CALL",
          );
        }
      }
    }

    async function checkFixedRotation(userId: string) {
      return isBusyInFixedRotation(userId, targetDate, data.institutionId);
    }

    // ---------- בדיקות ----------

    // 1. main teacher - רוטציה קבועה
    const mainFixed = await checkFixedRotation(data.mainTeacherId);
    if (mainFixed) {
      const garden =
        mainFixed.manager.mainManagedInstitutions?.[0]?.name || "אחר";
      throw new Error(
        `דיווח שגוי: הגננת רשומה כרוטציה קבועה בגן "${garden}" ביום זה.`,
      );
    }

    // 2. main teacher תפוסה כבר
    const mainBusy = await isUserBusy(data.mainTeacherId);
    if (mainBusy) {
      throw new Error(
        `כבר קיים דיווח עבור גננת זו בתאריך זה (גן ${mainBusy.institution.name}).`,
      );
    }

    // 3. substitute (אם קיים)
    if (data.substituteId) {
      // רוטציה קבועה
      const subFixed = await checkFixedRotation(data.substituteId);
      if (subFixed) {
        const garden =
          subFixed.manager.mainManagedInstitutions?.[0]?.name || "אחר";
        throw new Error(`לא ניתן לשבץ מחליפה: משובצת קבוע בגן "${garden}".`);
      }

      // תפוסה כבר
      const subBusy = await isUserBusy(data.substituteId);
      if (subBusy) {
        throw new Error(
          `המחליפה כבר משובצת בתאריך זה בגן "${subBusy.institution.name}".`,
        );
      }
    }

    // ---------- יצירה ----------
    const newPlacement = await tx.placement.create({
      data: {
        date: targetDate,
        institutionId: data.institutionId,
        mainTeacherId: data.mainTeacherId,
        substituteId: data.substituteId,
        notes: data.notes,
        status: data.status || "OPEN",
      },
      include: {
        institution: true,
        mainTeacher: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        substitute: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // ---------- הכנת נתונים להתראות ----------
    const { institution, mainTeacher, substitute, status } = newPlacement;

    const dateStr = targetDate.toLocaleDateString("he-IL");
    const mainName = `${mainTeacher.firstName} ${mainTeacher.lastName}`;
    const subName = substitute
      ? `${substitute.firstName} ${substitute.lastName}`
      : undefined;

    // ---------- התראות ----------
    await handlePlacementNotifications({
      tx,
      data,
      institution,
      status,
      mainName,
      subName,
      dateStr,
      targetDate,
    });

    return newPlacement;
  });
}

/**
 * שיבוץ ידני
 */
export async function db_manualAssign(
  placementId: string,
  substituteId: string,
  managerId: string,
) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
  });
  if (!placement) throw new Error("השיבוץ לא נמצא");
  if (placement.status === "CANCELLED") throw new Error("הגן הוגדר כסגור");

  await validatePlacement(substituteId, placement.date);
  return await db_assignSubstitute(placementId, substituteId);
}

/**
 * שיבוץ עצמי
 */
export async function db_selfAssign(placementId: string, substituteId: string) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    select: { date: true, status: true },
  });

  if (!placement || placement.status !== "OPEN") {
    throw new Error("השיבוץ אינו זמין יותר");
  }

  await validatePlacement(substituteId, placement.date);
  return await db_assignSubstitute(placementId, substituteId);
}

// --- פונקציית עזר לבניית תוכן ההודעה בצורה אחידה ---
function formatMessage(params: {
  prefix: string;
  statusText: string;
  gardenName: string;
  address: string;
  mainName: string;
  subName?: string;
  date: string;
}) {
  const { prefix, statusText, gardenName, address, mainName, subName, date } =
    params;
  let msg = `${prefix}, ${statusText}: גן ${gardenName}, כתובת: ${address}, גננת אם: ${mainName}, בתאריך: ${date}.`;
  if (subName) {
    msg += ` אוייש על ידי: ${subName}.`;
  }
  return msg;
}

/**
 * עדכון סטטוס
  עדכון סטטוס קיים (למשל סגירת גן)
 */

export async function db_updatePlacementStatus(params: any) {
  const updated = await prisma.placement.update({
    where: { id: params.placementId },
    data: {
      status: params.newStatus,
      substituteId:
        params.newStatus === "CANCELLED" || params.newStatus === "OPEN"
          ? null
          : undefined,
    },
    include: {
      institution: true,
      mainTeacher: { select: { firstName: true, lastName: true } },
      substitute: { select: { firstName: true, lastName: true } },
    },
  });
  const statusHebrew =
    updated.status === "CANCELLED"
      ? "הגן נסגר (אין פעילות)"
      : "השיבוץ הוחזר להמתנה";

  // עדכון המפקחת והמדריכה על שינוי הסטטוס
  await notifyHierarchy(updated, statusHebrew, params.actorRoles || []);

  const dateStr = new Date(updated.date).toLocaleDateString("he-IL");
  const mainName = `${updated.mainTeacher.firstName} ${updated.mainTeacher.lastName}`;

  // התראה למנהלות על סגירת הגן
  if (updated.status === "CANCELLED") {
    await db_createNotification({
      userId: updated.institution.supervisorId,
      title: "הגן נסגר",
      message: formatMessage({
        prefix: "מפקחת יקרה",
        statusText: "הגן הוגדר כסגור (אין פעילות)",
        gardenName: updated.institution.name,
        address: updated.institution.address,
        mainName,
        date: dateStr,
      }),
      type: "STATUS_UPDATE",
    });

    // הודעת ביטול למחליפות (אם הגן נסגר בזמן שהן חשבו ללכת אליו)
    const subs = await getAvailableForNotification(updated.date);
    if (subs.length > 0) {
      await db_notifyMultipleUsers(
        subs,
        "הגן נסגר",
        formatMessage({
          prefix: "גננת יקרה",
          statusText: "הגן נסגר ולא תתקיים בו פעילות",
          gardenName: updated.institution.name,
          address: updated.institution.address,
          mainName,
          date: dateStr,
        }),
      );
    }
  }

  return updated;
}

/**
 * לוח שנה
 */
/**

 * שליפת נתונים ללוח השנה הכוללת רוטציות קבועות ודיווחים ידניים
 */
export async function db_getCalendarData(
  month: number,
  year: number,
  supervisorId: string,
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // אנחנו שולפים רק את טבלת Placement.
  // רשומה בטבלה הזו קיימת רק אם מישהי דיווחה על היעדרות (חריגה מהשגרה).
  return await prisma.placement.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      institution: { supervisorId: supervisorId },
    },
    include: {
      institution: {
        include: {
          // הוספנו את השליפה של גננת האם והרוטציות הקבועות שלה
          mainManager: {
            include: { fixedRotationsAsManager: true },
          },
        },
      },
      mainTeacher: {
        select: { id: true, firstName: true, lastName: true, roles: true },
      },
      substitute: {
        select: { id: true, firstName: true, lastName: true, roles: true },
      },
    },

    orderBy: {
      date: "asc",
    },
  });
}

/**
 * עדכון מהיר של שדה בשיבוץ (עריכה ישירה מהלוח)
 */
export async function db_quickUpdatePlacement(
  id: string,
  data: { mainTeacherId?: string; substituteId?: string; status?: any },
) {
  return await prisma.placement.update({
    where: { id },
    data,
    include: {
      institution: true,
      substitute: true,
      mainTeacher: true,
    },
  });
}
/**
 * אישור שיבוץ
 */
/**
 * עדכון שיבוץ קיים (איוש מחליפה)
 */
export async function db_assignSubstitute(
  placementId: string,
  substituteId: string,
  actorRoles: string[] = [],
) {
  const updatedPlacement = await prisma.placement.update({
    where: { id: placementId },
    data: { substituteId, status: "ASSIGNED" },
    include: {
      institution: true,
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  const dateStr = updatedPlacement.date.toLocaleDateString("he-IL");
  const mainName = `${updatedPlacement.mainTeacher.firstName} ${updatedPlacement.mainTeacher.lastName}`;
  const subName = `${updatedPlacement.substitute!.firstName} ${
    updatedPlacement.substitute!.lastName
  }`;

  // א. עדכון מפקחת ומדריכה
  await notifyHierarchy(updatedPlacement, "השיבוץ אוייש בהצלחה", actorRoles);

  // ב. עדכון גננת האם
  await db_createNotification({
    userId: updatedPlacement.mainTeacherId,
    title: "נמצאה עבורך מחליפה",
    message: `גננת אם יקרה, נמצאה עבורך מחליפה: ${subName} תגיע להחליף אותך בגן ${updatedPlacement.institution.name} בתאריך ${dateStr}.`,
    type: "STATUS_UPDATE",
  });

  // ג. עדכון המחליפה
  await db_createNotification({
    userId: substituteId,
    title: "שיבוץ חדש עבורך",
    message: `גננת מחליפה יקרה, שובצת להחליף את ${mainName} בגן ${updatedPlacement.institution.name} בתאריך ${dateStr}.`,
    type: "STATUS_UPDATE",
  });

  return updatedPlacement;
}

//פונקציות למדריכה

export async function db_getInstructorDashboard(instructorId: string) {
  const today = startOfDay(new Date());

  // 1. שליפת כל המוסדות שמשויכים למדריכה הזו
  const myInstitutions = await prisma.institution.findMany({
    where: { instructorId: instructorId },
    select: { id: true, name: true },
  });

  const institutionIds = myInstitutions.map((inst) => inst.id);

  // 2. קריאות דחופות רק לגנים שלה
  const urgentAlerts = await prisma.placement.findMany({
    where: {
      institutionId: { in: institutionIds },
      status: "OPEN",
      date: { gte: today },
    },
    include: {
      institution: { select: { name: true } },
      mainTeacher: {
        select: { firstName: true, lastName: true, phoneNumber: true },
      },
    },
    orderBy: { date: "asc" },
  });

  // 3. פעילות אחרונה רק בגנים שלה
  const recentActivity = await prisma.placement.findMany({
    where: { institutionId: { in: institutionIds } },
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      institution: { select: { name: true } },
      substitute: { select: { firstName: true, lastName: true } },
      mainTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    urgentAlerts,
    recentActivity,
    myInstitutionsCount: institutionIds.length,
  };
}

// פונקציית עזר למציאת כל מי שזמינה להחלפה ביום מסוים

async function getAvailableForNotification(date: Date) {
  const dayOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][date.getDay()];
  const start = startOfDay(date);
  const busyInPlacements = await prisma.placement.findMany({
    where: { date: start, status: { in: ["ASSIGNED", "OPEN"] } },
    select: { substituteId: true, mainTeacherId: true },
  });
  const busyIds = new Set(
    [
      ...busyInPlacements.map((p) => p.substituteId),
      ...busyInPlacements.map((p) => p.mainTeacherId),
    ].filter(Boolean),
  );
  const busyRotations = await prisma.fixedRotation.findMany({
    where: { day: dayOfWeek as any },
    select: { rotationTeacherId: true },
  });
  busyRotations.forEach((r) => busyIds.add(r.rotationTeacherId));
  const potentialUsers = await prisma.user.findMany({
    where: {
      isWorking: true,
      roles: { hasSome: ["SUBSTITUTE", "ROTATION"] },
      id: { notIn: Array.from(busyIds) as string[] },
    },
    select: { id: true },
  });
  return potentialUsers.map((u) => u.id);
}

// src/services/placementService.ts

// --- פונקציית עזר פנימית לשליחת הודעה לדרגים הניהוליים ---
async function notifyHierarchy(
  placement: any,
  statusText: string,
  actorRoles: string[] = [],
) {
  const dateStr = placement.date.toLocaleDateString("he-IL");
  const mainName = `${placement.mainTeacher.firstName} ${placement.mainTeacher.lastName}`;
  const subName = placement.substitute
    ? `${placement.substitute.firstName} ${placement.substitute.lastName}`
    : "טרם נקבעה";

  const gardenInfo = `גן ${placement.institution.name} (כתובת: ${placement.institution.address})`;

  // 1. התראה למפקחת (רק אם היא לא זו שביצעה את הפעולה)
  if (!actorRoles.includes("SUPERVISOR")) {
    await db_createNotification({
      userId: placement.institution.supervisorId,
      title: "עדכון בשיבוץ גן",
      message: `מפקחת יקרה, ${statusText}: ${gardenInfo}, גננת אם: ${mainName}, בתאריך: ${dateStr}. אוייש ע"י: ${subName}.`,
      type: "STATUS_UPDATE",
    });
  }

  // 2. התראה למדריכה (רק אם היא לא זו שביצעה את הפעולה)
  if (
    placement.institution.instructorId &&
    !actorRoles.includes("INSTRUCTOR")
  ) {
    await db_createNotification({
      userId: placement.institution.instructorId,
      title: "עדכון בשיבוץ גן",
      message: `מדריכה יקרה, ${statusText}: ${gardenInfo}, גננת אם: ${mainName}, בתאריך: ${dateStr}. אוייש ע"י: ${subName}.`,
      type: "STATUS_UPDATE",
    });
  }
}
