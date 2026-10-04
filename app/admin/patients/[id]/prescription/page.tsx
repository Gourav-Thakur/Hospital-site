import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { patient, settings } from "@/db/schema";
import PrescriptionEditor from "@/components/admin/PrescriptionEditor";

export const dynamic = "force-dynamic";

export default async function PrescriptionPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [p] = await db.select().from(patient).where(eq(patient.id, id)).limit(1);
  if (!p) notFound();

  const [lh] = await db.select().from(settings).where(eq(settings.key, "letterhead")).limit(1);

  return (
    <PrescriptionEditor
      patient={{
        id: p.id, name: p.name, dob: p.dob, sex: p.sex,
        patientNo: p.patientNo, phone: p.phone, allergies: p.allergies,
      }}
      letterhead={lh?.value ?? null}
    />
  );
}
