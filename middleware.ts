import { NextRequest, NextResponse } from "next/server";
import {
  OWNER_COOKIE_NAME,
  OWNER_HEADER_NAME,
  generateOwnerId,
  normalizeOwnerId,
  resolveOwnerIdForSeason,
} from "./src/lib/ownership";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const rawHeaderOwnerId = normalizeOwnerId(requestHeaders.get(OWNER_HEADER_NAME));
  const rawCookieOwnerId = normalizeOwnerId(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  const headerOwnerId = resolveOwnerIdForSeason(rawHeaderOwnerId);
  const cookieOwnerId = resolveOwnerIdForSeason(rawCookieOwnerId);
  const ownerId = headerOwnerId ?? cookieOwnerId ?? generateOwnerId();

  requestHeaders.set(OWNER_HEADER_NAME, ownerId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (rawCookieOwnerId !== ownerId) {
    response.cookies.set({
      name: OWNER_COOKIE_NAME,
      value: ownerId,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
