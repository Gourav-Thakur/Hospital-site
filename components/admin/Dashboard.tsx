"use client";

import { useEffect, useMemo, useState } from "react";
import { fmt12, longDate, APPT_STATUS_LABELS, type Appointment } from "@/lib/pms-types";

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-app p-6 ${accent ? "bg-medical-deepteal text-white" : "bg-surface"}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className={`mt-1 text-sm font-semibold uppercase tracking-wide ${accent ? "text-medical-mint" : "text-muted"}`}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  useEffect(() => {
    Promise.all([
      fetch(`/api/appointments?date=${today}&pageSize=100`).then((r) => (r.ok ? r.json() : { appointments: [] })),
      fetch("/api/patients?pageSize=1").then((r) => (r.ok ? r.json() : { total: 0 })),
    ])
      .then(([a, p]) => { setAppts(a.appointments ?? []); setPatientCount(p.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const stats = useMemo(() => {
    const active = appts.filter((a) => !["cancelled", "no_show"].includes(a.status));
    return {
      today: active.length,
      waiting: appts.filter((a) => a.status === "checked_in").length,
      completed: appts.filter((a) => a.status === "completed").length,
    };
  }, [appts]);

  const queue = appts.filter((a) => !["cancelled", "no_show"].includes(a.status));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="text-muted">Today · {longDate(today)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Today's Appointments" value={loading ? "…" : stats.today} accent />
        <StatCard label="Checked-in" value={loading ? "…" : stats.waiting} />
        <StatCard label="Completed Today" value={loading ? "…" : stats.completed} />
        <StatCard label="Total Patients" value={loading || patientCount === null ? "…" : patientCount} />
      </div>

      <div className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Today's Queue</h2>
          <a href="/admin/appointments" className="text-sm font-semibold text-medical-deepteal hover:underline">Manage →</a>
        </div>
        {loading ? (
          <p className="text-muted py-6 text-center">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="text-muted py-6 text-center">No appointments today.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--border)]">
            {queue.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {a.patientName}
                    {a.patientAllergies && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">ALLERGY</span>}
                  </div>
                  <div className="text-sm text-muted truncate">{a.patientPhone} · {a.patientNo}</div>
                </div>
                <div className="text-sm text-right whitespace-nowrap">
                  <div className="font-semibold">{fmt12(a.intervalStart)}</div>
                  <div className="text-muted text-xs">{APPT_STATUS_LABELS[a.status]}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
