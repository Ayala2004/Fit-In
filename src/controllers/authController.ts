import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encrypt } from '../utils/crypto';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, firstName, lastName, email, idNumber, phoneNumber, dateOfBirth } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedID = encrypt(idNumber);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        idNumber: encryptedID,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: "User created successfully", user: userWithoutPassword });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ message: "Login successful", token, user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};