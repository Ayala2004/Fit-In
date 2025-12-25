import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'פרטים שגויים' }, { status: 401 });
    }

    // מחזירים רק מה שצריך
    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      roles: user.roles
    });
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 });
  }
}