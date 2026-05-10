import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/login(.*)', '/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return
  await auth.protect()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
