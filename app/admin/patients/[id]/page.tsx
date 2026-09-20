import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { db } from "@/db";
import { patient } from "@/db/schema";

export const dynamic = "force-dynamic";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-muted mb-1">{label}</div>
      <div className="text-app">{value || "—"}</div>
    </div>
  );
}

export default async function PatientProfilePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [p] = await db.select().from(patient).where(eq(patient.id, id)).limit(1);
  if (!p) notFound();

  return (
    <AdminShell>
      <div className="mb-4">
        <a href="/admin/patients" className="text-sm font-semibold text-medical-deepteal hover:underline">← All patients</a>
      </div>

      {/* Allergy warning banner — shown wherever this patient appears (spec rule) */}
      {p.allergies && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/40 p-4">
          <svg className="w-6 h-6 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <div className="font-bold text-red-700 dark:text-red-400">Allergies</div>
            <div className="text-red-700 dark:text-red-400">{p.allergies}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">{p.name} {p.archived && <span className="text-base text-muted">(archived)</span>}</h1>
          <p className="text-muted font-mono text-sm">{p.patientNo} · {p.phone}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Demographics */}
        <div className="lg:col-span-1 bg-surface border border-app rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold">Demographics</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" value={fmtDate(p.dob)} />
            <Field label="Sex" value={p.sex ? <span className="capitalize">{p.sex}</span> : "—"} />
            <Field label="Blood Group" value={p.bloodGroup} />
            <Field label="Email" value={p.email} />
            <Field label="Emergency" value={p.emergencyContact} />
          </div>
          <Field label="Address" value={p.address} />
          <Field label="Chronic Conditions" value={p.conditions} />
          <Field label="Notes" value={p.notes} />
        </div>

        {/* Upcoming appointments + visit timeline (populated in later slices) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-app rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-2">Upcoming Appointments</h2>
            <p className="text-muted text-sm py-6 text-center">Appointment scheduling arrives in the next build slice.</p>
          </div>
          <div className="bg-surface border border-app rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-2">Visit Timeline</h2>
            <p className="text-muted text-sm py-6 text-center">Visit records &amp; prescriptions arrive in a later slice.</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
