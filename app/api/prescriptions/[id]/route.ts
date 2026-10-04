import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { prescription, prescriptionItem } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const [rx] = await db.select().from(prescription).where(eq(prescription.id, id)).limit(1);
  if (!rx) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const items = await db.select().from(prescriptionItem).where(eq(prescriptionItem.prescriptionId, id)).orderBy(asc(prescriptionItem.sortOrder));
  return NextResponse.json({ prescription: rx, items });
}
