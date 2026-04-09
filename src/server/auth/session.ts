import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

const SESSION_COOKIE_NAME = "doc2crm_session";
const SESSION_DURATION = "7d";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setAudience(payload.tenantId)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSessionSecret());

  const userId = payload.sub;
  const tenantId = payload.aud;
  const email = payload.email;
  const role = payload.role;

  if (
    typeof userId !== "string" ||
    typeof tenantId !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string"
  ) {
    throw new Error("Invalid session payload");
  }

  return { userId, tenantId, email, role };
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
