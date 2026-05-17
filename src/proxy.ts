import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const protectedPrefixes = [
  '/admin',
  '/profile',
  '/my-events',
  '/create-event',
];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export const proxy = auth((req) => {
  if (isProtected(req.nextUrl.pathname) && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/profile',
    '/my-events',
    '/create-event',
  ],
};
