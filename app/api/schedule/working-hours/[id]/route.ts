import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workingHours } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

  const updates: Record<string, unknown> = {};
  if (body.startTime !== undefined) {
    if (!TIME_RE.test(String(body.startTime))) return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
    updates.startTime = String(body.startTime);
  }
  if (body.endTime !== undefined) {
    if (!TIME_RE.test(String(body.endTime))) return NextResponse.json({ error: "Invalid end time." }, { status: 400 });
    updates.endTime = String(body.endTime);
  }
  if (body.slotsPerHour !== undefined) {
    const n = Number(body.slotsPerHour);
    if (!Number.isInteger(n) || n < 1 || n > 30) return NextResponse.json({ error: "Slots per hour must be 1–30." }, { status: 400 });
    updates.slotsPerHour = n;
  }
  if (body.active !== undefined) updates.active = Boolean(body.active);

  if (updates.startTime && updates.endTime && String(updates.startTime) >= String(updates.endTime))
    return NextResponse.json({ error: "Start must be before end." }, { status: 400 });
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });

  const [updated] = await db.update(workingHours).set(updates).where(eq(workingHours.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ workingHours: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const [deleted] = await db.delete(workingHours).where(eq(workingHours.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
