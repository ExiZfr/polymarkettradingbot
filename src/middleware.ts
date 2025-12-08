import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || ''

    // Redirect polygraalx.app to app.polygraalx.app
    if (hostname === 'polygraalx.app' || hostname === 'www.polygraalx.app') {
        const url = new URL(request.url)
        url.hostname = 'app.polygraalx.app'
        url.port = '' // Remove port for production

        return NextResponse.redirect(url.toString(), 301)
    }

    return NextResponse.next()
}

// Apply middleware to all routes
export const config = {
    matcher: '/:path*',
}
