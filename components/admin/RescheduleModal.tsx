"use client";

import { useCallback, useEffect, useState } from "react";
import { fmt12, type Appointment, type AvailInterval } from "@/lib/pms-types";

export default function RescheduleModal({ appt, onClose, onDone }: { appt: Appointment; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(appt.date);
  const [intervals, setIntervals] = useState<AvailInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setSlot("");
    try {
      const res = await fetch("/api/appointments/availability?date=" + date);
      const d = await res.json();
      setIntervals(d.intervals ?? []);
    } finally { setLoading(false); }
  }, [date]);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!slot) return;
    setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, intervalStart: slot }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed."); load(); return; }
      onDone(); onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md my-8 bg-surface border border-app rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-extrabold mb-1">Reschedule</h2>
        <p className="text-sm text-muted mb-5">{appt.patientName} · currently {fmt12(appt.intervalStart)}</p>

        <label className="text-xs font-bold uppercase text-muted">New date
          <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-app bg-app outline-none text-sm text-app mb-4" />
        </label>

        {loading ? <p className="text-muted text-sm py-4 text-center">Loading…</p>
          : intervals.length === 0 ? <p className="text-muted text-sm py-4 text-center border border-app rounded-xl">No slots.</p>
          : (
            <div className="grid grid-cols-3 gap-2">
              {intervals.map((iv) => {
                const full = iv.free <= 0; const active = slot === iv.start;
                return (
                  <button key={iv.start} disabled={full} onClick={() => setSlot(iv.start)}
                    className={`px-2 py-2 rounded-lg border text-sm font-semibold ${active ? "bg-medical-deepteal text-white border-medical-deepteal" : full ? "border-app text-muted opacity-50 cursor-not-allowed" : "border-app hover:border-medical-deepteal"}`}>
                    {fmt12(iv.start)}
                  </button>
                );
              })}
            </div>
          )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-app font-semibold text-muted">Cancel</button>
          <button onClick={save} disabled={!slot || saving} className="px-4 py-2 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-50 text-white font-bold">
            {saving ? "Saving…" : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
