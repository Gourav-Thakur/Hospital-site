import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { medicine } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

// Parse one CSV column ("name"). Tolerates a header row and quoted values.
function parseNames(csv: string): string[] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let v = lines[i];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    // take the first column if commas slipped in
    v = v.split(",")[0].trim();
    if (i === 0 && v.toLowerCase() === "name") continue; // skip header
    if (v) out.push(v);
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let csv = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    csv = String(body.csv ?? "");
  } else {
    csv = await req.text();
  }
  if (!csv.trim()) return NextResponse.json({ error: "Empty file." }, { status: 400 });

  const names = parseNames(csv);
  if (names.length === 0) return NextResponse.json({ added: 0, skipped: 0, total: 0 });

  // Dedupe within the file and against existing (case-insensitive).
  const existing = await db.select({ name: medicine.name }).from(medicine);
  const have = new Set(existing.map((r) => r.name.toLowerCase()));
  const seen = new Set<string>();
  const toAdd: { name: string; active: boolean }[] = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (have.has(key) || seen.has(key)) continue;
    seen.add(key);
    toAdd.push({ name: n, active: true });
  }

  // Insert in chunks to stay within statement limits.
  for (let i = 0; i < toAdd.length; i += 500) {
    await db.insert(medicine).values(toAdd.slice(i, i + 500));
  }

  return NextResponse.json({ added: toAdd.length, skipped: names.length - toAdd.length, total: names.length });
}
