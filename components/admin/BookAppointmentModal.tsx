"use client";

import { useCallback, useEffect, useState } from "react";
import { fmt12, APPT_TYPES, type Patient, type AvailInterval } from "@/lib/pms-types";
import PatientPicker from "./PatientPicker";

type Props = { defaultDate: string; onClose: () => void; onBooked: () => void };

export default function BookAppointmentModal({ defaultDate, onClose, onBooked }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [intervals, setIntervals] = useState<AvailInterval[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<string>("");
  const [type, setType] = useState<string>("new");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);

  const loadSlots = useCallback(async () => {
    if (!patient) return;
    setLoadingSlots(true);
    setSlot("");
    try {
      const res = await fetch("/api/appointments/availability?date=" + date);
      const d = await res.json();
      setIntervals(d.intervals ?? []);
    } finally {
      setLoadingSlots(false);
    }
  }, [patient, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function book() {
    if (!patient || !slot) return;
    setError("");
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, date, intervalStart: slot, type, reason }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to book.");
        loadSlots(); // refresh in case it filled
        return;
      }
      onBooked();
      onClose();
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg my-8 bg-surface border border-app rounded-3xl shadow-2xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold mb-6">Book Appointment</h2>

        {/* Step 1: patient */}
        {!patient ? (
          <PatientPicker onSelect={setPatient} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-xl bg-app border border-app">
              <div>
                <div className="font-bold">{patient.name}
                  {patient.allergies && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">ALLERGY: {patient.allergies}</span>}
                </div>
                <div className="text-sm text-muted">{patient.phone} · {patient.patientNo}</div>
              </div>
              <button onClick={() => setPatient(null)} className="text-sm font-semibold text-medical-deepteal hover:underline">Change</button>
            </div>

            {/* Step 2: date + slots */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="text-xs font-bold uppercase text-muted">Date
                <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none text-sm text-app" />
              </label>
              <label className="text-xs font-bold uppercase text-muted">Type
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none text-sm text-app capitalize">
                  {APPT_TYPES.map((t) => <option key={t} value={t}>{t === "new" ? "New" : "Follow-up"}</option>)}
                </select>
              </label>
            </div>

            <div className="mb-4">
              <div className="text-xs font-bold uppercase text-muted mb-2">Available Slots</div>
              {loadingSlots ? (
                <p className="text-muted text-sm py-4 text-center">Loading slots…</p>
              ) : intervals.length === 0 ? (
                <p className="text-muted text-sm py-4 text-center border border-app rounded-xl">No slots on this day (closed or fully past).</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {intervals.map((iv) => {
                    const full = iv.free <= 0;
                    const active = slot === iv.start;
                    return (
                      <button key={iv.start} disabled={full} onClick={() => setSlot(iv.start)}
                        className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                          active ? "bg-medical-deepteal text-white border-medical-deepteal"
                          : full ? "border-app text-muted opacity-50 cursor-not-allowed"
                          : "border-app hover:border-medical-deepteal"}`}>
                        {fmt12(iv.start)}
                        <span className="block text-[11px] font-normal opacity-80">{full ? "Full" : `${iv.free} of ${iv.capacity} free`}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold uppercase text-muted">Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. blurred vision"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none text-sm" />
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app">Cancel</button>
              <button onClick={book} disabled={!slot || booking} className="px-5 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-50 text-white font-bold">
                {booking ? "Booking…" : "Book Slot"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
