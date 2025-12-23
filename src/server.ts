import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import "dotenv/config"; // חשוב לקריאת משתני סביבה

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// בדיקה שהשרת עובד
app.get('/ping', (req, res) => {
  res.send('pong');
});

// נתיב להרשמה (לפני ה-listen)
app.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, idNumber, phoneNumber, dateOfBirth } = req.body;
    
    const newUser = await prisma.user.create({
      data: {
        username,
        password, 
        firstName,
        lastName,
        email,
        idNumber,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        isAdmin: false
      },
    });
    
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// נתיב לשליפת משתמשים
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

const PORT = process.env.PORT || 5000;

// ה-Listen תמיד בסוף הקובץ
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});