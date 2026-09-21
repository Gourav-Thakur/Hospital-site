import { NextRequest, NextResponse } from "next/server";
import { asc, gte } from "drizzle-orm";
import { db } from "@/db";
import { scheduleException } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TYPES = ["leave", "holiday", "extra_hours"];

export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Default to upcoming (today onward); ?all=1 for full history.
  const all = req.nextUrl.searchParams.get("all") === "1";
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select()
    .from(scheduleException)
    .where(all ? undefined : gte(scheduleException.date, today))
    .orderBy(asc(scheduleException.date));
  return NextResponse.json({ exceptions: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const date = String(body.date ?? "");
  const type = String(body.type ?? "");
  const reason = body.reason ? String(body.reason).trim() : null;
  let startTime = body.startTime ? String(body.startTime) : null;
  let endTime = body.endTime ? String(body.endTime) : null;

  if (!DATE_RE.test(date)) return NextResponse.json({ error: "Valid date required." }, { status: 400 });
  if (!TYPES.includes(type)) return NextResponse.json({ error: "Invalid type." }, { status: 400 });

  // extra_hours must have a time range; leave/holiday default to full day (null times).
  if (type === "extra_hours") {
    if (!startTime || !endTime) return NextResponse.json({ error: "Extra hours need a start and end time." }, { status: 400 });
  }
  if (startTime || endTime) {
    if (!startTime || !endTime || !TIME_RE.test(startTime) || !TIME_RE.test(endTime))
      return NextResponse.json({ error: "Invalid time range (use HH:MM)." }, { status: 400 });
    if (startTime >= endTime) return NextResponse.json({ error: "Start must be before end." }, { status: 400 });
  } else {
    startTime = null;
    endTime = null;
  }

  // NOTE: conflict-with-existing-appointments check is added in the Appointments slice
  // (spec: blocking a time with appointments lists them first). No appointments exist yet.
  const [created] = await db
    .insert(scheduleException)
    .values({ date, type, reason, startTime, endTime })
    .returning();
  return NextResponse.json({ exception: created }, { status: 201 });
}
