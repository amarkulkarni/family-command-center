import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Pass through - authentication is now via Authorization headers, not cookies
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
