import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/sign-in(.*)',
  '/api/health',
  '/status',
])

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
)

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) return

      const { userId } = await auth()
      if (!userId) {
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    })
  : function noopMiddleware() {
      return NextResponse.next()
    }

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
