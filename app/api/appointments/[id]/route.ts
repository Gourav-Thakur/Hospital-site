import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointment, patient } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";
import { computeAvailability, istNow, ACTIVE_STATUSES } from "@/lib/availability";
import { hhmm, MAX_BOOK_DAYS_AHEAD } from "@/lib/pms-types";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Allowed status transitions.
const TRANSITIONS: Record<string, string[]> = {
  scheduled: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_consultation", "cancelled", "no_show"],
  in_consultation: ["completed"],
};

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [appt] = await db.select().from(appointment).where(eq(appointment.id, id)).limit(1);
  if (!appt) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const terminal = ["completed", "cancelled", "no_show"];
  const isReschedule = body.date !== undefined || body.intervalStart !== undefined;

  // ---- Reschedule ----
  if (isReschedule) {
    if (terminal.includes(appt.status))
      return NextResponse.json({ error: "Cannot reschedule a finished appointment." }, { status: 400 });

    const newDate = body.date ? String(body.date) : appt.date;
    const newStart = hhmm(body.intervalStart ? String(body.intervalStart) : appt.intervalStart);
    if (!DATE_RE.test(newDate)) return NextResponse.json({ error: "Valid date required." }, { status: 400 });
    if (!TIME_RE.test(newStart)) return NextResponse.json({ error: "Valid time required." }, { status: 400 });

    const today = istNow().date;
    const maxDate = new Date(new Date(today + "T00:00:00Z").getTime() + MAX_BOOK_DAYS_AHEAD * 86400000).toISOString().slice(0, 10);
    if (newDate < today) return NextResponse.json({ error: "Cannot move to a past date." }, { status: 400 });
    if (newDate > maxDate) return NextResponse.json({ error: `Cannot book beyond ${MAX_BOOK_DAYS_AHEAD} days.` }, { status: 400 });

    const avail = await computeAvailability(newDate);
    const interval = avail.find((iv) => iv.start === newStart);
    if (!interval) return NextResponse.json({ error: "That time is not available." }, { status: 409 });

    const sameSlot = newDate === appt.date && newStart === hhmm(appt.intervalStart);
    if (sameSlot) return NextResponse.json({ appointment: appt }); // nothing to do
    if (interval.free <= 0) return NextResponse.json({ error: "That hour is full." }, { status: 409 });

    // Positions taken by OTHER active appointments in the target slot.
    const takenRows = await db
      .select({ position: appointment.position })
      .from(appointment)
      .where(and(
        eq(appointment.date, newDate),
        eq(appointment.intervalStart, newStart),
        ne(appointment.id, id),
        inArray(appointment.status, ACTIVE_STATUSES as unknown as string[])
      ));
    const taken = new Set(takenRows.map((r) => r.position));
    let position = 0;
    for (let pos = 1; pos <= interval.capacity; pos++) if (!taken.has(pos)) { position = pos; break; }
    if (!position) return NextResponse.json({ error: "That hour is full." }, { status: 409 });

    try {
      const [updated] = await db
        .update(appointment)
        .set({ date: newDate, intervalStart: newStart, intervalEnd: interval.end, position, rescheduledFrom: new Date(), updatedAt: new Date() })
        .where(eq(appointment.id, id))
        .returning();
      return NextResponse.json({ appointment: updated });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (msg.includes("appt_active_slot_idx") || msg.includes("23505"))
        return NextResponse.json({ error: "That slot just filled up." }, { status: 409 });
      throw e;
    }
  }

  // ---- Status change ----
  if (body.status !== undefined) {
    const next = String(body.status);
    const allowed = TRANSITIONS[appt.status] ?? [];
    if (!allowed.includes(next))
      return NextResponse.json({ error: `Cannot change from ${appt.status} to ${next}.` }, { status: 400 });

    const updates: Record<string, unknown> = { status: next, updatedAt: new Date() };
    if (next === "cancelled") updates.cancelReason = body.cancelReason ? String(body.cancelReason).trim() : null;

    const [updated] = await db.update(appointment).set(updates).where(eq(appointment.id, id)).returning();
    return NextResponse.json({ appointment: updated });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
