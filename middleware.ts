import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PAGE_PREFIXES = ["/login", "/onboarding"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/onboarding"];
const SESSION_COOKIE_NAME = "doc2crm_session";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

async function isValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, getSessionSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico");

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const hasValidSession = await isValidSession(request);

  if (isPublicPage) {
    if (hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (isPublicApi) {
    return NextResponse.next();
  }

  if (!hasValidSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
