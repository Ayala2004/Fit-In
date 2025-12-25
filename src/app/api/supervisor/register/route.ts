import { NextResponse } from 'next/server';
import { db_registerUser } from '@/services/authService';
import { getSession } from '@/lib/auth'; // ייבוא הסשן

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

    const body = await req.json();
    
    const userData = {
      ...body,
      supervisorId: session.id, // הצמדת המפקחת המחוברת למשתמש החדש
    };

    const newUser = await db_registerUser(userData);
    return NextResponse.json({ message: 'המשתמש נוצר בהצלחה', user: newUser });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}