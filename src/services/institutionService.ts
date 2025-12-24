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
  return await prisma.institution.create({
    data
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