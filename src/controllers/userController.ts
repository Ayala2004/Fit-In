import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/crypto';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    
    const decryptedUsers = users.map(user => ({
      ...user,
      idNumber: user.idNumber ? decrypt(user.idNumber) : null,
      password: "PROTECTED" 
    }));

    res.json(decryptedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
// (כולל פענוח תעודת זהות)IDקבלת משתמש לפי  
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      idNumber: user.idNumber ? decrypt(user.idNumber) : null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

//  קבלת כל המוסדות בהן עבדה הגננת לפי איי די
export const getUserPlacements = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ה-ID של המשתמש מהכתובת
    const placements = await prisma.placement.findMany({
      where: {
        OR: [
          { mainTeacherId: id },
          { substituteId: id }
        ]
      },
      include: { institution: true } 
    });
    res.json(placements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    const whereClause: any = {
      OR: [{ mainTeacherId: id }, { substituteId: id }]
    };

    if (start && end) {
      whereClause.date = {
        gte: new Date(start as string),
        lte: new Date(end as string)
      };
    }

    const placements = await prisma.placement.findMany({
      where: whereClause,
      include: { institution: true },
      orderBy: { date: 'asc' }
    });

    res.json(placements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20 // 20 האחרונות
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};