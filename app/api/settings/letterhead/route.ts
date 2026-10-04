import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const KEY = "letterhead";
const MAX_CHARS = 2_000_000; // ~1.5 MB image as a data URL

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [row] = await db.select().from(settings).where(eq(settings.key, KEY)).limit(1);
  return NextResponse.json({ value: row?.value ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const dataUrl = String(body.dataUrl ?? "");
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(dataUrl))
    return NextResponse.json({ error: "Must be a PNG/JPG/WebP image." }, { status: 400 });
  if (dataUrl.length > MAX_CHARS)
    return NextResponse.json({ error: "Image too large (keep it under ~1.5 MB)." }, { status: 400 });

  await db
    .insert(settings)
    .values({ key: KEY, value: dataUrl, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: dataUrl, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.delete(settings).where(eq(settings.key, KEY));
  return NextResponse.json({ ok: true });
}
