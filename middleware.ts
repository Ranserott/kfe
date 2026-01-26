import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin-only routes
    if (path.startsWith('/products') || path.startsWith('/inventory')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.rewrite(new URL('/pos', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/pos/:path*',
    '/tables/:path*',
    '/kds/:path*',
    '/inventory/:path*',
    '/products/:path*',
    '/reports/:path*',
  ],
}
