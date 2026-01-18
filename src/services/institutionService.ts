import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function db_createInstitution(data: {
  name: string;
  address: string;
  institutionNumber: string;
  supervisorId: string;
  instructorId: string;
  mainManagerId: string;
}) {
  // בדיקה שכל ה-IDs קיימים לפני השליחה
  if (!data.supervisorId || !data.instructorId || !data.mainManagerId) {
    throw new Error("חסר מידע קריטי: מפקחת, מדריכה או גננת אם לא הוגדרו כראוי.");
  }

  return await prisma.institution.create({
    data: {
      name: data.name,
      address: data.address,
      institutionNumber: data.institutionNumber,
      // שימוש ב-connect מבטיח שפריזמה תקשר את האובייקטים נכון
      supervisor: { connect: { id: data.supervisorId } },
      instructor: { connect: { id: data.instructorId } },
      mainManager: { connect: { id: data.mainManagerId } },
    }
  });
}

export async function db_getAllInstitutions() {
  return await prisma.institution.findMany({
    include: { 
      users: true,
      supervisor: { select: { firstName: true, lastName: true } },
      instructor: { select: { firstName: true, lastName: true } }
    },
  });
}

// מציאת כל המוסדות שתחת מפקחת ספציפית
export async function db_getInstitutionsBySupervisor(supervisorId: string) {
    return await prisma.institution.findMany({
      where: { supervisorId }
    });
}