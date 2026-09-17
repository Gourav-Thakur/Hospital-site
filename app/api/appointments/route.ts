import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const BRANCHES = ["Bariatu Rd", "Chiraundi"];
const STATUSES = ["confirmed", "cancelled"];

export async function GET() {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db.select().from(appointments).orderBy(desc(appointments.preferredDate), desc(appointments.createdAt));
  return NextResponse.json({ appointments: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const branch = String(body.branch ?? "").trim();
  const preferredDate = String(body.preferredDate ?? "").trim();
  const notes = body.notes ? String(body.notes).trim() : null;
  const status = body.status ? String(body.status).trim() : "confirmed";

  const errors: string[] = [];
  if (!name) errors.push("name is required");
  if (!phone) errors.push("phone is required");
  if (!BRANCHES.includes(branch)) errors.push("valid branch is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.push("valid preferred date is required");
  if (!STATUSES.includes(status)) errors.push("invalid status");
  if (errors.length) {
    return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
  }

  const [created] = await db
    .insert(appointments)
    .values({ name, phone, branch, preferredDate, notes, status })
    .returning();

  return NextResponse.json({ appointment: created }, { status: 201 });
}
