import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect Admin API Routes and Admin Frontend Routes
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    
    // 1. Try to get token from Authorization header (API calls usually)
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.split(' ')[1];

    // 2. Fallback to localStorage or cookies if this is a frontend route
    // Note: Since localStorage isn't accessible in middleware, we typically rely on cookies.
    // Let's check cookies if no auth header.
    if (!token) {
      token = req.cookies.get('token')?.value;
    }
    
    // For API calls, if no token, 401
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
      } else {
        // Redirect to auth page if trying to access frontend admin pages
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Role-Based Access Control (RBAC)
      // Only 'admin' role can access these routes
      if (payload.role !== 'admin' && payload.role !== 'administrator') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ status: false, message: 'Forbidden. Admin access required.' }, { status: 403 });
        } else {
          return NextResponse.redirect(new URL('/account', req.url));
        }
      }

      // If authorized, proceed
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ status: false, message: 'Invalid or expired token' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};
