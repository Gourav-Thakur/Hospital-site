import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./auth";

// Returns the admin session, or null. Use in server components / route handlers.
export async function getAdmin(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
