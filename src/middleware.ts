import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

// src/middleware.ts (עדכון חלקי)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  if (!session) {
    if (pathname.startsWith('/supervisor') || pathname.startsWith('/instructor')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const payload = await decrypt(session);

  // הגנה על נתיב מפקחת
  if (pathname.startsWith('/supervisor') && !payload.roles.includes('SUPERVISOR')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // הגנה על נתיב מדריכה
  if (pathname.startsWith('/instructor') && !payload.roles.includes('INSTRUCTOR')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/supervisor/:path*', '/instructor/:path*'],
};

