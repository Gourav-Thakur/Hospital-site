import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { workingHours, scheduleException, appointment } from "@/db/schema";
import { hhmm, type AvailInterval } from "@/lib/pms-types";

// Statuses that occupy capacity (mirror of the DB partial-unique index).
export const ACTIVE_STATUSES = ["scheduled", "checked_in", "in_consultation", "completed"] as const;
export const DEFAULT_SLOTS_PER_HOUR = 4; // capacity for extra-hours intervals

type BaseInterval = { start: string; end: string; capacity: number };

function toMin(t: string): number {
  const [h, m] = hhmm(t).split(":").map(Number);
  return h * 60 + m;
}
function fromMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function hourly(start: string, end: string, capacity: number): BaseInterval[] {
  const out: BaseInterval[] = [];
  const endMin = toMin(end);
  for (let t = toMin(start); t + 60 <= endMin; t += 60) {
    out.push({ start: fromMin(t), end: fromMin(t + 60), capacity });
  }
  return out;
}
function overlaps(aS: string, aE: string, bS: string, bE: string): boolean {
  return aS < bE && bS < aE;
}

// Weekday (0–6) of a calendar date, timezone-independent.
export function weekdayOf(date: string): number {
  return new Date(date + "T00:00:00Z").getUTCDay();
}

// Current date + minutes in the clinic timezone (Asia/Kolkata).
export function istNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  let hh = Number(get("hour"));
  if (hh === 24) hh = 0; // some engines emit 24 at midnight
  const minutes = hh * 60 + Number(get("minute"));
  return { date, minutes };
}

// Base bookable intervals for a date = working hours (+ extra hours) − full/timed leave.
export async function computeBaseIntervals(date: string): Promise<BaseInterval[]> {
  const weekday = weekdayOf(date);
  const [blocks, exceptions] = await Promise.all([
    db.select().from(workingHours).where(and(eq(workingHours.weekday, weekday), eq(workingHours.active, true))),
    db.select().from(scheduleException).where(eq(scheduleException.date, date)),
  ]);

  // Full-day leave/holiday closes the whole day.
  const closed = exceptions.some((e) => (e.type === "leave" || e.type === "holiday") && !e.startTime);
  if (closed) return [];

  let intervals: BaseInterval[] = [];
  for (const b of blocks) intervals.push(...hourly(b.startTime, b.endTime, b.slotsPerHour));
  for (const e of exceptions) {
    if (e.type === "extra_hours" && e.startTime && e.endTime) {
      intervals.push(...hourly(e.startTime, e.endTime, DEFAULT_SLOTS_PER_HOUR));
    }
  }

  // Remove intervals overlapping a timed leave/holiday.
  const timedOff = exceptions.filter((e) => (e.type === "leave" || e.type === "holiday") && e.startTime && e.endTime);
  intervals = intervals.filter(
    (iv) => !timedOff.some((l) => overlaps(iv.start, iv.end, hhmm(l.startTime), hhmm(l.endTime)))
  );

  // Dedupe by start (keep the largest capacity if a block + extra hours coincide).
  const byStart = new Map<string, BaseInterval>();
  for (const iv of intervals) {
    const prev = byStart.get(iv.start);
    if (!prev || iv.capacity > prev.capacity) byStart.set(iv.start, iv);
  }
  return [...byStart.values()].sort((a, b) => a.start.localeCompare(b.start));
}

// Full availability for a date: base intervals + booked/free counts, minus past intervals today.
export async function computeAvailability(date: string): Promise<AvailInterval[]> {
  const base = await computeBaseIntervals(date);
  if (base.length === 0) return [];

  const appts = await db
    .select({ intervalStart: appointment.intervalStart, position: appointment.position })
    .from(appointment)
    .where(and(eq(appointment.date, date), inArray(appointment.status, ACTIVE_STATUSES as unknown as string[])));

  const bookedByStart = new Map<string, number>();
  for (const a of appts) {
    const k = hhmm(a.intervalStart);
    bookedByStart.set(k, (bookedByStart.get(k) ?? 0) + 1);
  }

  const now = istNow();
  const isToday = date === now.date;

  return base
    .filter((iv) => !(isToday && toMin(iv.start) <= now.minutes)) // drop past intervals today
    .map((iv) => {
      const booked = bookedByStart.get(iv.start) ?? 0;
      return { start: iv.start, end: iv.end, capacity: iv.capacity, booked, free: Math.max(0, iv.capacity - booked) };
    });
}

// Positions already taken (active) in a given interval.
export async function takenPositions(date: string, intervalStart: string): Promise<Set<number>> {
  const rows = await db
    .select({ position: appointment.position })
    .from(appointment)
    .where(
      and(
        eq(appointment.date, date),
        eq(appointment.intervalStart, intervalStart),
        inArray(appointment.status, ACTIVE_STATUSES as unknown as string[])
      )
    );
  return new Set(rows.map((r) => r.position));
}

export { fromMin, toMin };
