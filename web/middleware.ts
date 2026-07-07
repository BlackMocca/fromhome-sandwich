/** Auth Middleware — Cookie-based JWT for 1-2 active users (SPEC.md §5) */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/receipt', '/dashboard', '/management'];
const PUBLIC_PATHS = ['/', '/login', '/api/', '/auth/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static assets, and Auth routes
  if (
    pathname.startsWith('/api/') || 
    pathname.match(/\.(png|jpg|svg|woff2)$/) ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next();
  }

  // Check auth token from cookie (Supabase cookies start with 'sb-')
  const hasToken = Array.from(request.cookies.getAll()).some((cookie) =>
    cookie.name.startsWith('sb-')
  );
  
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
  
  if (isProtectedPath && !hasToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Allow public pages even without token
  return NextResponse.next();
}

export const config = {
  matcher: ['/receipt/:path*', '/dashboard/:path*', '/management/:path*', '/', '/auth/callback'],
};
