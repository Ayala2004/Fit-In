import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // 1. אם אין סשן והוא מנסה לגשת לדף מוגן
  if (!session) {
    if (pathname.startsWith('/supervisor') || 
        pathname.startsWith('/instructor') || 
        pathname.startsWith('/manager') ||
        pathname.startsWith('/rotation') ||
        pathname.startsWith('/substitute')) { 
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  let payload;
  try {
    payload = await decrypt(session);
  } catch (e) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('session');
    return res;
  }

  // 3. ניתוב אוטומטי אם כבר מחוברים ומנסים להיכנס ללוגין
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }

  // 4. הגנת נתיבים לפי תפקידים (RBAC)
  if (pathname.startsWith('/supervisor') && !payload.roles.includes('SUPERVISOR')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/instructor') && !payload.roles.includes('INSTRUCTOR')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/manager') && !payload.roles.includes('MANAGER')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/rotation') && !payload.roles.includes('ROTATION')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }
  if (pathname.startsWith('/substitute') && !payload.roles.includes('SUBSTITUTE')) {
    return NextResponse.redirect(new URL(getHomePath(payload.roles), request.url));
  }

  return NextResponse.next();
}

function getHomePath(roles: string[]) {
    if (roles.includes('SUPERVISOR')) return '/supervisor';
    if (roles.includes('INSTRUCTOR')) return '/instructor';
    if (roles.includes('MANAGER')) return '/manager';
    if (roles.includes('ROTATION')) return '/rotation';
    if (roles.includes('SUBSTITUTE')) return '/substitute'; 
    return '/';
}

export const config = {
  matcher: [
    '/supervisor/:path*', 
    '/instructor/:path*', 
    '/manager/:path*', 
    '/rotation/:path*', 
    '/substitute/:path*', 
    '/login'
  ],
};