import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth'; // ייבוא הפונקציה החדשה
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // הערה: בעתיד כדאי להשתמש ב-bcrypt להשוואת סיסמאות מוצפנות
    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'פרטים שגויים' }, { status: 401 });
    }

    // יצירת הסשן
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // שעתיים מהיום
    const session = await encrypt({ 
      id: user.id, 
      roles: user.roles, 
      name: `${user.firstName} ${user.lastName}` 
    });

    
    const cookieStore = await cookies(); // מחכים ל-cookies
    cookieStore.set('session', session, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      roles: user.roles
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 });
  }
}