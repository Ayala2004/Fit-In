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