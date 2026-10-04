import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { medicine } from "@/db/schema";
import { getAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

// Export active medicines as CSV. When empty, returns just the header row, so the
// download doubles as the upload template.
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select({ name: medicine.name }).from(medicine).where(eq(medicine.active, true)).orderBy(asc(medicine.name));

  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = ["name", ...rows.map((r) => esc(r.name))].join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="medicines.csv"',
    },
  });
}
