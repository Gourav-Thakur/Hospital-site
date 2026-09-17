import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

// Basic in-memory rate limiting (per warm instance). Slows brute force; not a substitute
// for a real limiter, but meaningful for a single-admin panel.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, password } = body;
  const envUser = process.env.ADMIN_USERNAME;
  const envHashEncoded = process.env.ADMIN_PASSWORD_HASH;

  if (!envUser || !envHashEncoded) {
    return NextResponse.json({ error: "Admin credentials are not configured." }, { status: 500 });
  }
  // Hash is stored base64-encoded (see scripts/hash-password.mjs) to survive env parsing.
  const envHash = Buffer.from(envHashEncoded, "base64").toString("utf8");
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const userOk = username === envUser;
  const passOk = await bcrypt.compare(password, envHash);
  // Compare both regardless of userOk to reduce timing signal.
  if (!userOk || !passOk) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await signSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
