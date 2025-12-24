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