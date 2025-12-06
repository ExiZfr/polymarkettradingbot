import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')
    const { pathname } = request.nextUrl

    // 1. Define Public and Protected Routes
    const isLoginPage = pathname.startsWith('/login');
    const isApiRoute = pathname.startsWith('/api');
    const isPublicResource = pathname.includes('.'); // images, etc.
    const isLandingPage = pathname === '/'; // The root is now a public landing page

    // 2. Protected Routes: Any route starting with /dashboard requires a session
    const isProtectedRoute = pathname.startsWith('/dashboard');

    // Scenario A: Unauthenticated User tries to access Protected Route -> Redirect to Login
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Scenario B: Authenticated User tries to access Login or Landing -> Redirect to Dashboard
    if (session && (isLoginPage || isLandingPage)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
