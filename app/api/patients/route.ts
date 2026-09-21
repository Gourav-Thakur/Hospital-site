import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { patient } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";
import { patientNoFromId } from "@/lib/pms-types";

export const runtime = "nodejs";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export async function GET(req: NextRequest) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const includeArchived = sp.get("archived") === "1";
  const page = clamp(Number(sp.get("page")) || 1, 1, 100000);
  const pageSize = clamp(Number(sp.get("pageSize")) || 20, 1, 100);

  const filters = [];
  if (!includeArchived) filters.push(eq(patient.archived, false));
  if (q) {
    const like = `%${q}%`;
    filters.push(or(ilike(patient.name, like), ilike(patient.phone, like), ilike(patient.patientNo, like))!);
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(patient).where(where).orderBy(desc(patient.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)::int` }).from(patient).where(where),
  ]);

  return NextResponse.json({ patients: rows, total: n, page, pageSize });
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
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required." }, { status: 400 });

  // Duplicate warning: same phone. Client can resend with confirmDuplicate:true to proceed.
  if (!body.confirmDuplicate) {
    const existing = await db
      .select({ id: patient.id, patientNo: patient.patientNo, name: patient.name })
      .from(patient)
      .where(and(eq(patient.phone, phone), eq(patient.archived, false)))
      .limit(3);
    if (existing.length) {
      return NextResponse.json(
        { error: "possible_duplicate", duplicates: existing },
        { status: 409 }
      );
    }
  }

  const values = {
    patientNo: "tmp", // replaced right after insert with VH-<id>
    name,
    phone,
    dob: body.dob ? String(body.dob) : null,
    sex: body.sex ? String(body.sex) : null,
    email: body.email ? String(body.email).trim() : null,
    address: body.address ? String(body.address).trim() : null,
    emergencyContact: body.emergencyContact ? String(body.emergencyContact).trim() : null,
    bloodGroup: body.bloodGroup ? String(body.bloodGroup) : null,
    allergies: body.allergies ? String(body.allergies).trim() : null,
    conditions: body.conditions ? String(body.conditions).trim() : null,
    notes: body.notes ? String(body.notes).trim() : null,
    createdBy: "admin",
  };

  const [inserted] = await db.insert(patient).values({ ...values, patientNo: `tmp-${Date.now()}` }).returning();
  const [updated] = await db
    .update(patient)
    .set({ patientNo: patientNoFromId(inserted.id) })
    .where(eq(patient.id, inserted.id))
    .returning();

  return NextResponse.json({ patient: updated }, { status: 201 });
}
