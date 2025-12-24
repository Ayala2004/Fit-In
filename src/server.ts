import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import "dotenv/config"; // חשוב לקריאת משתני סביבה
import bcrypt from 'bcrypt';
import { decrypt, encrypt } from './utils/crypto';
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// בדיקה שהשרת עובד
app.get('/ping', (req, res) => {
  res.send('pong');
});

// נתיב להרשמה 
app.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, idNumber, phoneNumber, dateOfBirth } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const encryptedID = encrypt(idNumber);
    const newUser = await prisma.user.create({
      data: {
        username,
        password:hashedPassword, 
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
});

// נתיב לשליפת משתמשים
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
      const decryptedUsers = users.map(user => ({
      ...user,
      idNumber: user.idNumber ? decrypt(user.idNumber) : null,
      password: "PROTECTED" 
    }));

    res.json(decryptedUsers);
  res.json(users);
});
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. חיפוש המשתמש לפי שם משתמש
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // 2. השוואת הסיסמה שהוזנה עם ה-Hash בבסיס הנתונים
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // 3. הצלחה - מחזירים את פרטי המשתמש (ללא הסיסמה)
    const { password: _, ...userWithoutPassword } = user;
    
    // כאן בעתיד נוסיף Token (JWT), כרגע נחזיר אישור פשוט
    res.status(200).json({ 
      message: "Login successful", 
      user: userWithoutPassword 
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});