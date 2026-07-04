/** Auth Middleware — Cookie-based JWT for 1-2 active users (SPEC.md §5) */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/receipt', '/dashboard'];
const PUBLIC_PATHS = ['/', '/login', '/api/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (pathname.startsWith('/api/') || pathname.match(/\.(png|jpg|svg|woff2)$/)) {
    return NextResponse.next();
  }

  // Check auth token from cookie
  const token = request.cookies.get('sb-auth-token')?.value;
  
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow public pages even without token
  return NextResponse.next();
}

export const config = {
  matcher: ['/receipt/:path*', '/dashboard/:path*', '/'],
};
