"use client";

import { useEffect, useMemo, useState } from "react";
import { type Appointment, STATUSES } from "@/lib/types";
import AppointmentForm from "./AppointmentForm";

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "confirmed"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles}`}>{status}</span>;
}

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AppointmentsManager() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.appointments);
    } catch {
      setError("Could not load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.phone.toLowerCase().includes(q) || a.branch.toLowerCase().includes(q);
    });
  }, [items, query, statusFilter]);

  async function doDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${confirmDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((a) => a.id !== confirmDelete.id));
        setConfirmDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Appointments</h1>
          <p className="text-muted">{items.length} total</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 bg-medical-deepteal hover:bg-teal-800 text-white font-bold px-5 py-3 rounded-xl transition-all w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Appointment
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, branch…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-app bg-surface focus:ring-2 focus:ring-medical-deepteal outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-app bg-surface focus:ring-2 focus:ring-medical-deepteal outline-none"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-surface border border-app rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app text-muted uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 font-bold">Patient</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Branch</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No appointments found.</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-t border-app hover:bg-app/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-muted">{a.phone}</div>
                      {a.notes && <div className="text-xs text-muted mt-1 max-w-xs truncate" title={a.notes}>{a.notes}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.preferredDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{a.branch}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditing(a); setFormOpen(true); }} className="px-3 py-1.5 rounded-lg text-medical-deepteal hover:bg-medical-mint font-semibold">Edit</button>
                        <button onClick={() => setConfirmDelete(a)} className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <AppointmentForm initial={editing} onClose={() => setFormOpen(false)} onSaved={load} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm bg-surface border border-app rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete appointment?</h3>
            <p className="text-muted text-sm mb-6">
              This will permanently remove <strong className="text-app">{confirmDelete.name}</strong>&apos;s appointment.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl border border-app font-semibold text-muted">Cancel</button>
              <button onClick={doDelete} disabled={deleting} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
