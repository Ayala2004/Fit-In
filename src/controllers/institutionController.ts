import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// יצירת מוסד חדש
export const createInstitution = async (req: Request, res: Response) => {
  try {
    const { name, address, institutionNumber, manager } = req.body;

    // בדיקה בסיסית ששדות החובה קיימים
    if (!name || !address || !institutionNumber) {
      return res.status(400).json({ error: "Missing required fields: name, address, or institutionNumber" });
    }

    const newInstitution = await prisma.institution.create({
      data: { 
        name, 
        address, 
        institutionNumber, 
        manager: manager || null // מבטיח שאם manager ריק הוא יישמר כ-null בצורה מפורשת
      }
    });

    res.status(201).json(newInstitution);
  } catch (error: any) {
    // טיפול במקרה של מספר מוסד כפול (Unique constraint)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Institution number already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

// 2. קבלת כל המוסדות
export const getAllInstitutions = async (req: Request, res: Response) => {
  try {
    const institutions = await prisma.institution.findMany({
      include: { users: true } // אופציונלי: יראה לנו את כל הגננות הקבועות של המוסד
    });
    res.json(institutions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};