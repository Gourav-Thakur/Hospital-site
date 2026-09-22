"use client";

import { useCallback, useEffect, useState } from "react";
import { fmt12, longDate, shortDate, APPT_STATUS_LABELS, type Appointment } from "@/lib/pms-types";
import BookAppointmentModal from "./BookAppointmentModal";
import RescheduleModal from "./RescheduleModal";
import Pagination from "./Pagination";

const PAGE_SIZE = 20;

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  checked_in: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  in_consultation: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function AppointmentsDay() {
  const [date, setDate] = useState(""); // empty = upcoming
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  useEffect(() => { setPage(1); }, [date]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (date) params.set("date", date);
      const res = await fetch("/api/appointments?" + params.toString());
      const d = await res.json();
      setItems(d.appointments ?? []);
      setTotal(d.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [date, page]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(a: Appointment, status: string) {
    await fetch(`/api/appointments/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const upcomingMode = !date;
  let lastDate = "";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Appointments</h1>
          <p className="text-muted">{upcomingMode ? "Upcoming" : longDate(date)} · {total} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl border border-app bg-surface outline-none text-app" />
          {date && (
            <button onClick={() => setDate("")} className="px-3 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app whitespace-nowrap">Clear</button>
          )}
          <button onClick={() => setBooking(true)} className="inline-flex items-center justify-center gap-2 bg-medical-deepteal hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl whitespace-nowrap grow sm:grow-0">
            + Book
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-center py-16">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-muted text-center py-16 bg-surface border border-app rounded-2xl">
          {upcomingMode ? "No upcoming appointments." : `No appointments on ${date}.`}
        </div>
      ) : (
        <div className="bg-surface border border-app rounded-2xl divide-y divide-[color:var(--border)]">
          {items.map((a) => {
            const showDateHeader = upcomingMode && a.date !== lastDate;
            lastDate = a.date;
            return (
              <div key={a.id}>
                {showDateHeader && (
                  <div className="px-4 py-2 bg-app text-xs font-bold uppercase tracking-wide text-muted">{longDate(a.date)}</div>
                )}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-medical-deepteal">{fmt12(a.intervalStart)}</span>
                      <a href={`/admin/patients/${a.patientId}`} className="font-semibold hover:underline">{a.patientName}</a>
                      {a.patientAllergies && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">ALLERGY</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[a.status] ?? ""}`}>{APPT_STATUS_LABELS[a.status]}</span>
                      <span className="text-xs text-muted capitalize">· {a.type.replace("_", "-")}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {!upcomingMode ? "" : `${shortDate(a.date)} · `}{a.patientPhone} · {a.patientNo}
                      {a.reason ? ` · ${a.reason}` : ""}
                      {a.status === "cancelled" && a.cancelReason ? ` · ${a.cancelReason}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {a.status === "scheduled" && (
                      <>
                        <ActBtn onClick={() => setStatus(a, "checked_in")} tone="primary">Check in</ActBtn>
                        <ActBtn onClick={() => setRescheduling(a)}>Reschedule</ActBtn>
                        <ActBtn onClick={() => setCancelling(a)} tone="danger">Cancel</ActBtn>
                        <ActBtn onClick={() => setStatus(a, "no_show")}>No-show</ActBtn>
                      </>
                    )}
                    {a.status === "checked_in" && (
                      <>
                        <ActBtn onClick={() => setStatus(a, "in_consultation")} tone="primary">Start consult</ActBtn>
                        <ActBtn onClick={() => setCancelling(a)} tone="danger">Cancel</ActBtn>
                      </>
                    )}
                    {a.status === "in_consultation" && (
                      <ActBtn onClick={() => setStatus(a, "completed")} tone="primary">Complete</ActBtn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {booking && <BookAppointmentModal defaultDate={date || todayISO()} onClose={() => setBooking(false)} onBooked={load} />}
      {rescheduling && <RescheduleModal appt={rescheduling} onClose={() => setRescheduling(null)} onDone={load} />}
      {cancelling && <CancelModal appt={cancelling} onClose={() => setCancelling(null)} onDone={load} />}
    </div>
  );
}

function ActBtn({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: "primary" | "danger" }) {
  const cls = tone === "primary"
    ? "bg-medical-deepteal text-white hover:bg-teal-800"
    : tone === "danger"
    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-app"
    : "text-muted hover:bg-app border border-app";
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${cls}`}>{children}</button>;
}

function CancelModal({ appt, onClose, onDone }: { appt: Appointment; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  async function confirm() {
    setSaving(true);
    try {
      await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: reason }),
      });
      onDone(); onClose();
    } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface border border-app rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">Cancel appointment?</h3>
        <p className="text-muted text-sm mb-4">{appt.patientName} — this frees the slot.</p>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)"
          className="w-full px-3 py-2 rounded-lg border border-app bg-app outline-none text-sm mb-5" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-app font-semibold text-muted">Keep</button>
          <button onClick={confirm} disabled={saving} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold">
            {saving ? "Cancelling…" : "Cancel appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
