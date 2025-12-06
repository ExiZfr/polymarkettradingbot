import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Define protected routes
    const isDashboardRoute = path.startsWith('/dashboard');

    // 2. Get session
    const cookie = request.cookies.get('session')?.value;

    // 3. If accessing protected route
    if (isDashboardRoute) {
        if (!cookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const session = await decrypt(cookie);

            // 4. Check Premium Status (Optional: Enforce strict premium access)
            // If you want to block non-premium users from the dashboard entirely:
            /*
            if (!session.is_premium) {
               return NextResponse.redirect(new URL('/pricing', request.url));
            }
            */

            return NextResponse.next();
        } catch (error) {
            // Invalid session
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect / to /dashboard if logged in
    if (path === '/') {
        if (cookie) {
            try {
                await decrypt(cookie);
                return NextResponse.redirect(new URL('/dashboard', request.url));
            } catch (e) { }
        }
        // Otherwise show landing or login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
