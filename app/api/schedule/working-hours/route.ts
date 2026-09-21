import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { workingHours } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(workingHours)
    .orderBy(asc(workingHours.weekday), asc(workingHours.startTime));
  return NextResponse.json({ workingHours: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const weekday = Number(body.weekday);
  const startTime = String(body.startTime ?? "");
  const endTime = String(body.endTime ?? "");
  const slotsPerHour = Number(body.slotsPerHour);

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)
    return NextResponse.json({ error: "Invalid weekday." }, { status: 400 });
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime))
    return NextResponse.json({ error: "Invalid time (use HH:MM)." }, { status: 400 });
  if (startTime >= endTime)
    return NextResponse.json({ error: "Start time must be before end time." }, { status: 400 });
  if (!Number.isInteger(slotsPerHour) || slotsPerHour < 1 || slotsPerHour > 30)
    return NextResponse.json({ error: "Slots per hour must be 1–30." }, { status: 400 });

  const [created] = await db
    .insert(workingHours)
    .values({ weekday, startTime, endTime, slotsPerHour, active: true })
    .returning();
  return NextResponse.json({ workingHours: created }, { status: 201 });
}
