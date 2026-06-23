import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("__Secure-better-auth.session_token")
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }
  }

  // Prevent accessing sign-up completely
  if (pathname.startsWith("/sign-up")) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
}
