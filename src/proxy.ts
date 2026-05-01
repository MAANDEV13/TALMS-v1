import { type NextRequest, NextResponse } from "next/server";

// Proxy (Next.js 16 renamed "middleware" to "proxy")
// Session refresh will be added here once Supabase Auth migration is complete.
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
