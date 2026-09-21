import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patient } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const EDITABLE = [
  "name", "phone", "dob", "sex", "email", "address",
  "emergencyContact", "bloodGroup", "allergies", "conditions", "notes",
] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const [row] = await db.select().from(patient).where(eq(patient.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ patient: row });
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

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  // Archive / restore toggle.
  if (body.archived !== undefined) updates.archived = Boolean(body.archived);

  for (const key of EDITABLE) {
    if (body[key] === undefined) continue;
    if (key === "name") {
      const v = String(body.name).trim();
      if (!v) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      updates.name = v;
    } else if (key === "phone") {
      const v = String(body.phone).trim();
      if (!v) return NextResponse.json({ error: "Phone cannot be empty." }, { status: 400 });
      updates.phone = v;
    } else {
      const raw = body[key];
      updates[key] = raw === null || raw === "" ? null : String(raw).trim();
    }
  }

  const [updated] = await db.update(patient).set(updates).where(eq(patient.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ patient: updated });
}
