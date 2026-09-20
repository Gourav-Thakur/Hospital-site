"use client";

import { useState } from "react";
import { SEXES, BLOOD_GROUPS, type Patient } from "@/lib/pms-types";

type Props = {
  initial?: Patient | null;
  onClose: () => void;
  onSaved: (p: Patient) => void;
};

type Dup = { id: number; patientNo: string; name: string };

export default function PatientForm({ initial, onClose, onSaved }: Props) {
  const isEdit = Boolean(initial);
  const [f, setF] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    dob: initial?.dob ?? "",
    sex: initial?.sex ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    emergencyContact: initial?.emergencyContact ?? "",
    bloodGroup: initial?.bloodGroup ?? "",
    allergies: initial?.allergies ?? "",
    conditions: initial?.conditions ?? "",
    notes: initial?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [dups, setDups] = useState<Dup[] | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(confirmDuplicate = false) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/patients/${initial!.id}` : "/api/patients", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, confirmDuplicate }),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === "possible_duplicate") {
        setDups(data.duplicates);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved(data.patient);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full px-3 py-2 rounded-lg border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none transition-all text-sm";
  const label = "block text-xs font-bold mb-1 uppercase tracking-wide text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-2xl my-8 bg-surface border border-app rounded-3xl shadow-2xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold mb-6">{isEdit ? "Edit Patient" : "New Patient"}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Full Name *</label>
            <input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={label}>Phone *</label>
            <input className={field} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={label}>Date of Birth</label>
            <input type="date" className={field} value={f.dob ?? ""} onChange={(e) => set("dob", e.target.value)} />
          </div>
          <div>
            <label className={label}>Sex</label>
            <select className={field} value={f.sex} onChange={(e) => set("sex", e.target.value)}>
              <option value="">—</option>
              {SEXES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Blood Group</label>
            <select className={field} value={f.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Email</label>
            <input className={field} value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className={label}>Emergency Contact</label>
            <input className={field} value={f.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Address</label>
            <input className={field} value={f.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className={label}>Allergies</label>
            <input className={field} value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. Penicillin" />
          </div>
          <div>
            <label className={label}>Chronic Conditions</label>
            <input className={field} value={f.conditions} onChange={(e) => set("conditions", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Notes</label>
            <textarea className={field} rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        {dups && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
              Possible duplicate — a patient with this phone already exists:
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-300 list-disc pl-5 mb-3">
              {dups.map((d) => <li key={d.id}>{d.name} ({d.patientNo})</li>)}
            </ul>
            <button onClick={() => submit(true)} disabled={saving} className="text-sm font-bold px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
              Create anyway
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app">Cancel</button>
          <button onClick={() => submit(false)} disabled={saving} className="px-5 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
