import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { medicine } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const updates: Record<string, unknown> = {};
  if (body.active !== undefined) updates.active = Boolean(body.active);
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    const [dupe] = await db.select({ id: medicine.id }).from(medicine).where(and(ilike(medicine.name, name), ne(medicine.id, id))).limit(1);
    if (dupe) return NextResponse.json({ error: "Another medicine already has that name." }, { status: 409 });
    updates.name = name;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const [updated] = await db.update(medicine).set(updates).where(eq(medicine.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ medicine: updated });
}
