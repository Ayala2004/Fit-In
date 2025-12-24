import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// יצירת מוסד חדש
export const createInstitution = async (req: Request, res: Response) => {
  try {
    // 1. קבלת הנתונים מה-Body (שימי לב לשמות החדשים)
    const { name, address, institutionNumber, supervisorId, instructorId,mainManagerId } = req.body;

    // 2. בדיקת שדות חובה
    if (!name || !address || !institutionNumber) {
      return res.status(400).json({
        error: "Missing required fields: name, address, or institutionNumber",
      });
    }

    // 3. יצירת המוסד ב-Prisma
    const newInstitution = await prisma.institution.create({
      data: {
        name,
        address,
        institutionNumber,
        // קישור למפקחת אם נשלח ID
        supervisorId: supervisorId || null,
        // קישור למדריכה אם נשלח ID
        instructorId: instructorId || null,
      },
    });

    res.status(201).json(newInstitution);
  } catch (error: any) {
    // 4. טיפול בשגיאת ערך ייחודי (מספר מוסד קיים)
    if (error.code === "P2002") {
      return res.status(400).json({ 
        error: "Institution number already exists" 
      });
    }
    res.status(400).json({ error: error.message });
  }
};

// 2. קבלת כל המוסדות
export const getAllInstitutions = async (req: Request, res: Response) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: { users: true }, // אופציונלי: יראה לנו את כל הגננות הקבועות של המוסד
    });
    res.json(institutions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
