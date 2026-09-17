import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "vh_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (set a long random string).");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; role: "admin" };

// Edge-compatible: uses Web Crypto via jose, so it runs in middleware.
export async function signSession(username: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: "admin" };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
