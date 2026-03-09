import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Only protect /admin routes (not /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Check for auth token in cookies
    const token = request.cookies.get('ql_admin_token')?.value;
    
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Basic token validation (expiry check)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp || payload.exp * 1000 < Date.now() || payload.role !== 'admin') {
          const loginUrl = new URL('/admin/login', request.url);
          return NextResponse.redirect(loginUrl);
        }
      } else {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (e) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
