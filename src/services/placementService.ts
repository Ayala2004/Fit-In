import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// הפונקציה הזו היא ה"מוח" - היא לא יודעת אם קראו לה מהאתר או מאפליקציה
export async function db_createPlacement(data: {
  date: Date;
  institutionId: string;
  mainTeacherId: string;
  notes?: string;
}) {
  return await prisma.placement.create({
    data: {
      date: data.date,
      institutionId: data.institutionId,
      mainTeacherId: data.mainTeacherId,
      notes: data.notes,
      status: "OPEN",
    },
  });
}

// מציאת שיבוצים לפי חודש ושנה (עבור לוח השנה)
export async function db_getCalendarData(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await prisma.placement.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        institution: { select: { name: true } },
        mainTeacher: { select: { firstName: true, lastName: true } },
        substitute: { select: { firstName: true, lastName: true } }
      }
    });
}

// אישור שיבוץ ע"י מחליפה
export async function db_assignSubstitute(placementId: string, substituteId: string) {
    return await prisma.placement.update({
      where: { id: placementId },
      data: {
        substituteId,
        status: "ASSIGNED", // השתמשנו ב-Enum החדש שלנו
      },
      include: {
        institution: true,
        substitute: { select: { firstName: true, lastName: true, phoneNumber: true } }
      }
    });
}