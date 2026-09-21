import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/require-admin";
import { computeAvailability } from "@/lib/availability";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) return NextResponse.json({ error: "Valid date required." }, { status: 400 });

  const intervals = await computeAvailability(date);
  return NextResponse.json({ date, intervals });
}
