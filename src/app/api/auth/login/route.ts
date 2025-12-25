import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt'; // ייבוא bcrypt

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // שימוש ב-bcrypt להשוואת הסיסמה המוצפנת
    const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isPasswordValid) {
      return NextResponse.json({ message: 'פרטים שגויים' }, { status: 401 });
    }

    // יצירת הסשן
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const session = await encrypt({ 
      id: user.id, 
      roles: user.roles, 
      name: `${user.firstName} ${user.lastName}` 
    });

    const cookieStore = await cookies();
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