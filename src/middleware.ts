import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')
    const { pathname } = request.nextUrl

    // 1. If user is on a Dashboard route but has NO session -> Redirect to Login
    // We assume all routes except /login and /api are protected
    const isAuthPage = pathname.startsWith('/login')
    const isApiRoute = pathname.startsWith('/api')
    const isPublicResource = pathname.includes('.') // images, etc.

    // Protect root / and anything that isn't login/api/public
    if (!session && !isAuthPage && !isApiRoute && !isPublicResource) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If user is on Login page but HAS session -> Redirect to Dashboard
    if (session && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
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
