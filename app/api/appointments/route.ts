import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointment, patient } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";
import { computeAvailability, istNow } from "@/lib/availability";
import { hhmm, MAX_BOOK_DAYS_AHEAD, APPT_TYPES } from "@/lib/pms-types";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const selectWithPatient = {
  id: appointment.id,
  patientId: appointment.patientId,
  date: appointment.date,
  intervalStart: appointment.intervalStart,
  intervalEnd: appointment.intervalEnd,
  position: appointment.position,
  type: appointment.type,
  reason: appointment.reason,
  status: appointment.status,
  cancelReason: appointment.cancelReason,
  createdAt: appointment.createdAt,
  patientName: patient.name,
  patientPhone: patient.phone,
  patientNo: patient.patientNo,
  patientAllergies: patient.allergies,
};

// GET /api/appointments?date=YYYY-MM-DD (day view) OR ?patientId=123&upcoming=1
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const patientId = sp.get("patientId");

  if (patientId) {
    const pid = Number(patientId);
    if (!Number.isInteger(pid)) return NextResponse.json({ error: "Invalid patientId." }, { status: 400 });
    const filters = [eq(appointment.patientId, pid)];
    if (sp.get("upcoming") === "1") {
      filters.push(inArray(appointment.status, ["scheduled", "checked_in", "in_consultation"]));
    }
    const rows = await db
      .select(selectWithPatient)
      .from(appointment)
      .leftJoin(patient, eq(appointment.patientId, patient.id))
      .where(and(...filters))
      .orderBy(asc(appointment.date), asc(appointment.intervalStart), asc(appointment.createdAt));
    return NextResponse.json({ appointments: rows });
  }

  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const page = clamp(Number(sp.get("page")) || 1, 1, 100000);
  const pageSize = clamp(Number(sp.get("pageSize")) || 20, 1, 100);

  // A specific date filters to that day; no date defaults to upcoming (today onward).
  const date = sp.get("date") || "";
  if (date && !DATE_RE.test(date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });

  const where = date
    ? eq(appointment.date, date)
    : gte(appointment.date, istNow().date);

  // Specific day: FCFS within interval. Upcoming: chronological across days.
  const order = date
    ? [asc(appointment.intervalStart), asc(appointment.createdAt)]
    : [asc(appointment.date), asc(appointment.intervalStart), asc(appointment.createdAt)];

  const [rows, [{ n }]] = await Promise.all([
    db.select(selectWithPatient)
      .from(appointment)
      .leftJoin(patient, eq(appointment.patientId, patient.id))
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)::int` }).from(appointment).where(where),
  ]);

  return NextResponse.json({ appointments: rows, total: n, page, pageSize, date: date || null });
}

// POST /api/appointments  { patientId, date, intervalStart, type, reason }
export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patientId = Number(body.patientId);
  const date = String(body.date ?? "");
  const intervalStart = hhmm(String(body.intervalStart ?? ""));
  const type = APPT_TYPES.includes(body.type as (typeof APPT_TYPES)[number]) ? String(body.type) : "new";
  const reason = body.reason ? String(body.reason).trim() : null;

  if (!Number.isInteger(patientId) || patientId <= 0) return NextResponse.json({ error: "Select a patient." }, { status: 400 });
  if (!DATE_RE.test(date)) return NextResponse.json({ error: "Valid date required." }, { status: 400 });
  if (!TIME_RE.test(intervalStart)) return NextResponse.json({ error: "Select a time slot." }, { status: 400 });

  // Within booking window.
  const today = istNow().date;
  const maxDate = new Date(new Date(today + "T00:00:00Z").getTime() + MAX_BOOK_DAYS_AHEAD * 86400000)
    .toISOString().slice(0, 10);
  if (date < today) return NextResponse.json({ error: "Cannot book a past date." }, { status: 400 });
  if (date > maxDate) return NextResponse.json({ error: `Cannot book more than ${MAX_BOOK_DAYS_AHEAD} days ahead.` }, { status: 400 });

  // Patient must exist (DB FK also enforces this).
  const [p] = await db.select({ id: patient.id }).from(patient).where(eq(patient.id, patientId)).limit(1);
  if (!p) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

  // The interval must currently be available with free capacity.
  const avail = await computeAvailability(date);
  const interval = avail.find((iv) => iv.start === intervalStart);
  if (!interval) return NextResponse.json({ error: "That time is not available." }, { status: 409 });
  if (interval.free <= 0) return NextResponse.json({ error: "That hour is full." }, { status: 409 });

  // FCFS: take the lowest free position; the partial-unique index guards against races.
  const takenRows = await db
    .select({ position: appointment.position })
    .from(appointment)
    .where(and(
      eq(appointment.date, date),
      eq(appointment.intervalStart, intervalStart),
      inArray(appointment.status, ["scheduled", "checked_in", "in_consultation", "completed"])
    ));
  const taken = new Set(takenRows.map((r) => r.position));
  const candidates = [];
  for (let pos = 1; pos <= interval.capacity; pos++) if (!taken.has(pos)) candidates.push(pos);

  for (const position of candidates) {
    try {
      const [created] = await db
        .insert(appointment)
        .values({
          patientId, date, intervalStart, intervalEnd: interval.end,
          position, type, reason, status: "scheduled", createdBy: "admin",
        })
        .returning();
      return NextResponse.json({ appointment: created }, { status: 201 });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (msg.includes("appt_active_slot_idx") || msg.includes("23505")) continue; // race: try next position
      throw e;
    }
  }
  return NextResponse.json({ error: "That hour just filled up." }, { status: 409 });
}
