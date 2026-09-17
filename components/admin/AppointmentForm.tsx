"use client";

import { useState } from "react";
import { BRANCHES, STATUSES, todayISO, type Appointment } from "@/lib/types";

type Props = {
  initial?: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
};

// Modal form used for both "create manually" and "edit".
export default function AppointmentForm({ initial, onClose, onSaved }: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [branch, setBranch] = useState(initial?.branch ?? BRANCHES[0]);
  const [preferredDate, setPreferredDate] = useState(initial?.preferredDate ?? todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "confirmed");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { name, phone, branch, preferredDate, notes, status };
      const res = await fetch(isEdit ? `/api/appointments/${initial!.id}` : "/api/appointments", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full px-4 py-2.5 rounded-xl border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none transition-all";
  const label = "block text-xs font-bold mb-1.5 uppercase tracking-wide text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface border border-app rounded-3xl shadow-2xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold mb-6">{isEdit ? "Edit Appointment" : "New Appointment"}</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="f-name">Full Name</label>
              <input id="f-name" className={field} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={label} htmlFor="f-phone">Phone</label>
              <input id="f-phone" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className={label} htmlFor="f-branch">Branch</label>
              <select id="f-branch" className={field} value={branch} onChange={(e) => setBranch(e.target.value)}>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="f-date">Preferred Date</label>
              <input id="f-date" type="date" className={field} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="f-status">Status</label>
              <select id="f-status" className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="f-notes">Notes / Issue</label>
              <textarea id="f-notes" className={field} rows={3} value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Any specifics or the patient's issue" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
