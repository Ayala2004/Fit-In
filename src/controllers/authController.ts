import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encrypt } from '../utils/crypto';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      username, 
      password, 
      firstName, 
      lastName, 
      email, 
      roles, 
      idNumber, 
      phoneNumber, 
      dateOfBirth 
    } = req.body;

    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    if (existingUser) {
      return res.status(400).json({ error: "שם משתמש או אימייל כבר קיימים במערכת" });
    }

    //  הצפנה והאשינג
    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedID = encrypt(idNumber);

    // יצירת המשתמש בבסיס הנתונים
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        roles: roles || ["USER"], // ברירת מחדל אם לא נשלח
        idNumber: encryptedID,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false
      },
    });
    

    //  הסרת הסיסמה מהאובייקט שחוזר לקליינט
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      message: "User created successfully", 
      user: userWithoutPassword 
    });

  } catch (error: any) {
    // טיפול בשגיאת Unique (שם משתמש, אימייל או ת.ז קיימים)
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      return res.status(400).json({ 
        error: `נראה שהערך בשדה ${target} כבר קיים במערכת. יש לבחור ערך אחר.` 
      });
    }

    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 1. חיפוש המשתמש
    const user = await prisma.user.findUnique({ where: { username } });

    // 2. בדיקת סיסמה
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
    }

    // 3. יצירת טוקן
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin, roles: user.roles },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    // 4. החזרת תשובה ללא סיסמה
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ 
      message: "Login successful", 
      token, 
      user: userWithoutPassword 
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};