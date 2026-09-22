"use client";

import { useEffect, useState } from "react";
import {
  WEEKDAYS, EXCEPTION_TYPES, EXCEPTION_LABELS, hhmm,
  type WorkingHours, type ScheduleException,
} from "@/lib/pms-types";

const field = "px-3 py-2 rounded-lg border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none text-sm";

export default function ScheduleManager() {
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [h, e] = await Promise.all([
        fetch("/api/schedule/working-hours").then((r) => r.json()),
        fetch("/api/schedule/exceptions").then((r) => r.json()),
      ]);
      setHours(h.workingHours ?? []);
      setExceptions(e.exceptions ?? []);
    } catch {
      setError("Could not load schedule.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Schedule</h1>
        <p className="text-muted">Working hours and time off. Times are Asia/Kolkata.</p>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <WorkingHoursCard hours={hours} loading={loading} onChanged={load} />
        <ExceptionsCard exceptions={exceptions} loading={loading} onChanged={load} />
      </div>
    </div>
  );
}

function WorkingHoursCard({ hours, loading, onChanged }: { hours: WorkingHours[]; loading: boolean; onChanged: () => void }) {
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotsPerHour, setSlotsPerHour] = useState(4);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/schedule/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekday, startTime, endTime, slotsPerHour }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Failed."); return; }
      onChanged();
    } finally { setBusy(false); }
  }

  async function remove(id: number) {
    await fetch(`/api/schedule/working-hours/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="bg-surface border border-app rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-4">Weekly Working Hours</h2>

      <div className="flex flex-wrap items-end gap-2 mb-5 pb-5 border-b border-app">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">Day
          <select className={field} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">From
          <input type="time" className={field} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">To
          <input type="time" className={field} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">Slots/hr
          <input type="number" min={1} max={30} className={`${field} w-20`} value={slotsPerHour} onChange={(e) => setSlotsPerHour(Number(e.target.value))} />
        </label>
        <button onClick={add} disabled={busy} className="px-4 py-2 rounded-lg bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-sm w-full sm:w-auto">Add</button>
      </div>
      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

      {loading ? (
        <p className="text-muted text-center py-6">Loading…</p>
      ) : hours.length === 0 ? (
        <p className="text-muted text-center py-6">No working hours set yet.</p>
      ) : (
        <div className="space-y-3">
          {WEEKDAYS.map((day, i) => {
            const blocks = hours.filter((h) => h.weekday === i);
            if (blocks.length === 0) return null;
            return (
              <div key={i} className="flex gap-3">
                <div className="w-24 shrink-0 font-semibold text-sm pt-1.5">{day}</div>
                <div className="flex flex-wrap gap-2">
                  {blocks.map((b) => (
                    <span key={b.id} className="inline-flex items-center gap-2 bg-app border border-app rounded-lg pl-3 pr-1.5 py-1.5 text-sm">
                      {hhmm(b.startTime)}–{hhmm(b.endTime)}
                      <span className="text-muted text-xs">· {b.slotsPerHour}/hr</span>
                      <button onClick={() => remove(b.id)} aria-label="Remove" className="text-muted hover:text-red-600 px-1">×</button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExceptionsCard({ exceptions, loading, onChanged }: { exceptions: ScheduleException[]; loading: boolean; onChanged: () => void }) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<string>("leave");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const needsTime = type === "extra_hours";

  async function add() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/schedule/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type, startTime: startTime || null, endTime: endTime || null, reason }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Failed."); return; }
      setReason(""); setStartTime(""); setEndTime("");
      onChanged();
    } finally { setBusy(false); }
  }

  async function remove(id: number) {
    await fetch(`/api/schedule/exceptions/${id}`, { method: "DELETE" });
    onChanged();
  }

  function fmt(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="bg-surface border border-app rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-4">Leave, Holidays &amp; Extra Hours</h2>

      <div className="flex flex-wrap items-end gap-2 mb-5 pb-5 border-b border-app">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">Date
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">Type
          <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
            {EXCEPTION_TYPES.map((t) => <option key={t} value={t}>{EXCEPTION_LABELS[t]}</option>)}
          </select>
        </label>
        {(needsTime || startTime || endTime) && (
          <>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">From
              <input type="time" className={field} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">To
              <input type="time" className={field} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </>
        )}
        <button onClick={add} disabled={busy || !date} className="px-4 py-2 rounded-lg bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-sm w-full sm:w-auto">Add</button>
      </div>
      {!needsTime && <p className="text-xs text-muted -mt-3 mb-3">Leave/holiday with no time = full day off.</p>}
      {err && <p className="text-red-600 text-sm mb-3">{err}</p>}

      {loading ? (
        <p className="text-muted text-center py-6">Loading…</p>
      ) : exceptions.length === 0 ? (
        <p className="text-muted text-center py-6">No upcoming exceptions.</p>
      ) : (
        <ul className="divide-y divide-[color:var(--border)]">
          {exceptions.map((x) => (
            <li key={x.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{fmt(x.date)}</div>
                <div className="text-sm text-muted">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mr-2 ${x.type === "extra_hours" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"}`}>{EXCEPTION_LABELS[x.type]}</span>
                  {x.startTime ? `${hhmm(x.startTime)}–${hhmm(x.endTime)}` : "Full day"}
                  {x.reason ? ` · ${x.reason}` : ""}
                </div>
              </div>
              <button onClick={() => remove(x.id)} className="text-muted hover:text-red-600 px-2 font-semibold">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
