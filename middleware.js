import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Only protect /admin routes (not /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Check for auth token in cookies
    const token = request.cookies.get('ql_admin_token')?.value;
    
    // If no token, redirect to login
    if (!token) {
      console.log('[Middleware] No token found, redirecting to login');
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Basic token validation (expiry check)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[Middleware] Invalid token format');
        const loginUrl = new URL('/admin/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        // Clear invalid cookie
        response.cookies.delete('ql_admin_token');
        return response;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiry
      if (!payload.exp || payload.exp * 1000 < Date.now()) {
        console.log('[Middleware] Token expired');
        const loginUrl = new URL('/admin/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('ql_admin_token');
        return response;
      }
      
      // Check role
      if (payload.role !== 'admin') {
        console.log('[Middleware] Invalid role');
        const loginUrl = new URL('/admin/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('ql_admin_token');
        return response;
      }
      
      // Token is valid, allow access
      console.log('[Middleware] Token valid, allowing access');
      return NextResponse.next();
      
    } catch (e) {
      console.log('[Middleware] Token parse error:', e.message);
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('ql_admin_token');
      return response;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
