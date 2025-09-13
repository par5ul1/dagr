import { getSessionCookie } from "better-auth/cookies";
import * as server from "next/server";

export async function middleware(request: server.NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie && !pathname.startsWith("/auth")) {
    return server.NextResponse.redirect(new URL("/auth", request.url));
  }

  if (sessionCookie && pathname.startsWith("/auth")) {
    return server.NextResponse.redirect(new URL("/", request.url));
  }

  return server.NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
