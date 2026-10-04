import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { prescription, prescriptionItem, patient } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const patientId = Number(req.nextUrl.searchParams.get("patientId"));
  if (!Number.isInteger(patientId) || patientId <= 0)
    return NextResponse.json({ error: "patientId required." }, { status: 400 });

  const rows = await db.select().from(prescription).where(eq(prescription.patientId, patientId)).orderBy(desc(prescription.createdAt));
  return NextResponse.json({ prescriptions: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const patientId = Number(body.patientId);
  const notes = body.notes ? String(body.notes).trim() : null;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .map((it) => ({ medicineName: String((it as Record<string, unknown>)?.medicineName ?? "").trim(), note: String((it as Record<string, unknown>)?.note ?? "").trim() }))
    .filter((it) => it.medicineName);

  if (!Number.isInteger(patientId) || patientId <= 0) return NextResponse.json({ error: "Invalid patient." }, { status: 400 });
  if (items.length === 0 && !notes) return NextResponse.json({ error: "Add at least one medicine or a note." }, { status: 400 });

  const [p] = await db.select({ id: patient.id }).from(patient).where(eq(patient.id, patientId)).limit(1);
  if (!p) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

  const [created] = await db.insert(prescription).values({ patientId, notes, createdBy: "admin" }).returning();
  if (items.length) {
    await db.insert(prescriptionItem).values(items.map((it, i) => ({
      prescriptionId: created.id, medicineName: it.medicineName, note: it.note || null, sortOrder: i,
    })));
  }
  return NextResponse.json({ id: created.id }, { status: 201 });
}
