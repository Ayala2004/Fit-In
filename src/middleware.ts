import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // 1. אם אין סשן והוא מנסה לגשת לדף מוגן
  if (!session) {
    if (pathname.startsWith('/supervisor') || 
        pathname.startsWith('/instructor') || 
        pathname.startsWith('/manager')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. פענוח הטוקן
  let payload;
  try {
    payload = await decrypt(session);
  } catch (e) {
    // טוקן לא תקין או פג תוקף
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('session');
    return res;
  }

  // 3. אם הוא מחובר ומנסה להיכנס ללוגין
  if (pathname === '/login') {
    if (payload.roles.includes('SUPERVISOR')) return NextResponse.redirect(new URL('/supervisor', request.url));
    if (payload.roles.includes('INSTRUCTOR')) return NextResponse.redirect(new URL('/instructor', request.url));
    if (payload.roles.includes('MANAGER')) return NextResponse.redirect(new URL('/manager', request.url));
  }

  // 4. הגנת נתיבים לפי תפקידים (Role Based Access Control)
  if (pathname.startsWith('/supervisor') && !payload.roles.includes('SUPERVISOR')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/instructor') && !payload.roles.includes('INSTRUCTOR')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/manager') && !payload.roles.includes('MANAGER')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }

  return NextResponse.next();
}

// פונקציית עזר למציאת הבית של המשתמש
function getHomePath(roles: string[]) {
    if (roles.includes('SUPERVISOR')) return '/supervisor';
    if (roles.includes('INSTRUCTOR')) return '/instructor';
    if (roles.includes('MANAGER')) return '/manager';
    return '/';
}

export const config = {
  matcher: ['/supervisor/:path*', '/instructor/:path*', '/manager/:path*', '/login'],
};