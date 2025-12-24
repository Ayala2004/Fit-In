import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// דיווח על היעדרות (יצירת שיבוץ)
// Body: { date: "2023-10-27T08:00:00Z", institutionId: "...", mainTeacherId: "...", notes: "..." }
export const createPlacement = async (req: Request, res: Response) => {
  try {
    const { date, institutionId, mainTeacherId, notes } = req.body;

    const newPlacement = await prisma.placement.create({
      data: {
        date: new Date(date),
        institutionId,
        mainTeacherId,
        notes,
        status: "OPEN" // סטטוס התחלתי - מחפשים מחליפה
      }
    });

    res.status(201).json(newPlacement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

//  מציאת כל השיבוצים הפתוחים (למורה מחליפה שמחפשת עבודה)
export const getOpenPlacements = async (req: Request, res: Response) => {
  try {
    const placements = await prisma.placement.findMany({
      where: { status: "OPEN" },
      include: {
        institution: true,
        mainTeacher: {
          select: { firstName: true, lastName: true } // רק שמות, בלי מידע רגיש
        }
      }
    });
    res.json(placements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

//  אישור שיבוץ על ידי מורה מחליפה
// URL: /placements/:id/assign
// Body: { substituteId: "..." }
export const assignSubstitute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ה-ID של השיבוץ
    const { substituteId } = req.body;

    const updatedPlacement = await prisma.placement.update({
      where: { id },
      data: {
        substituteId,
        status: "CLOSED" // ברגע שיש מחליפה, השיבוץ נסגר
      },
      include: {
        institution: true,
        substitute: {
          select: { firstName: true, lastName: true, phoneNumber: true }
        }
      }
    });

    res.json({ message: "Placement assigned successfully", updatedPlacement });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};