import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const BRANCHES = ["Bariatu Rd", "Chiraundi"];
const STATUSES = ["confirmed", "cancelled"];

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    updates.name = name;
  }
  if (body.phone !== undefined) {
    const phone = String(body.phone).trim();
    if (!phone) return NextResponse.json({ error: "phone cannot be empty" }, { status: 400 });
    updates.phone = phone;
  }
  if (body.branch !== undefined) {
    const branch = String(body.branch).trim();
    if (!BRANCHES.includes(branch)) return NextResponse.json({ error: "invalid branch" }, { status: 400 });
    updates.branch = branch;
  }
  if (body.preferredDate !== undefined) {
    const preferredDate = String(body.preferredDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return NextResponse.json({ error: "invalid date" }, { status: 400 });
    updates.preferredDate = preferredDate;
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes ? String(body.notes).trim() : null;
  }
  if (body.status !== undefined) {
    const status = String(body.status).trim();
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const [updated] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ appointment: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const [deleted] = await db.delete(appointments).where(eq(appointments.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
