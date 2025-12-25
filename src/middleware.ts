import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // הגנה על נתיבי ה-supervisor
  if (pathname.startsWith('/supervisor')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await decrypt(session);
      // בדיקה אם המשתמש הוא אכן supervisor
      if (!payload.roles.includes('SUPERVISOR')) {
        return NextResponse.redirect(new URL('/', request.url)); // חזרה לדף הבית אם אין הרשאה
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// הגדרה על אילו נתיבים ה-Middleware ירוץ
export const config = {
  matcher: ['/supervisor/:path*'],
};