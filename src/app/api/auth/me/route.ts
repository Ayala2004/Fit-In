import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth'; // הפונקציה שמשחזרת את המידע מהטוקן

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ message: 'לא מחובר' }, { status: 401 });
    }

    // פענוח הסשן (מכיל id, roles, name כפי שהגדרת ב-Login)
    const payload = await decrypt(session);

    if (!payload) {
      return NextResponse.json({ message: 'סשן לא תקין' }, { status: 401 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 });
  }
}