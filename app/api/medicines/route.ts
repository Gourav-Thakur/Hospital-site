import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { medicine } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const includeInactive = sp.get("inactive") === "1";
  const page = clamp(Number(sp.get("page")) || 1, 1, 100000);
  const pageSize = clamp(Number(sp.get("pageSize")) || 20, 1, 100);

  const filters = [];
  if (!includeInactive) filters.push(eq(medicine.active, true));
  if (q) filters.push(ilike(medicine.name, `%${q}%`));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(medicine).where(where).orderBy(asc(medicine.name)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ n: sql<number>`count(*)::int` }).from(medicine).where(where),
  ]);
  return NextResponse.json({ medicines: rows, total: n, page, pageSize });
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  // Case-insensitive dedupe; reactivate if it exists but was deactivated.
  const [existing] = await db.select().from(medicine).where(ilike(medicine.name, name)).limit(1);
  if (existing) {
    if (!existing.active) {
      const [re] = await db.update(medicine).set({ active: true }).where(eq(medicine.id, existing.id)).returning();
      return NextResponse.json({ medicine: re, reactivated: true }, { status: 200 });
    }
    return NextResponse.json({ medicine: existing, existed: true }, { status: 200 });
  }

  const [created] = await db.insert(medicine).values({ name, active: true }).returning();
  return NextResponse.json({ medicine: created }, { status: 201 });
}
