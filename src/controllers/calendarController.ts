import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getCalendarData = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query; // לדוגמה 2, 2025
    
    if (!month || !year) return res.status(400).json({ error: "Missing month/year" });

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const placements = await prisma.placement.findMany({
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

    res.json(placements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};