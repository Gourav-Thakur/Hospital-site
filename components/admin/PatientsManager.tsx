"use client";

import { useCallback, useEffect, useState } from "react";
import { type Patient } from "@/lib/pms-types";
import PatientForm from "./PatientForm";

function ageFromDob(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000))) + "y";
}

export default function PatientsManager() {
  const [items, setItems] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (showArchived) params.set("archived", "1");
      const res = await fetch("/api/patients?" + params.toString());
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.patients);
    } catch {
      setError("Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [query, showArchived]);

  // Debounced reload on query / filter change.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function toggleArchive(p: Patient) {
    await fetch(`/api/patients/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !p.archived }),
    });
    load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Patients</h1>
          <p className="text-muted">{items.length} shown</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 bg-medical-deepteal hover:bg-teal-800 text-white font-bold px-5 py-3 rounded-xl transition-all w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Patient
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, or patient ID…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-app bg-surface focus:ring-2 focus:ring-medical-deepteal outline-none"
        />
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app bg-surface text-sm font-semibold text-muted cursor-pointer select-none">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-surface border border-app rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app text-muted uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 font-bold">Patient ID</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Age / Sex</th>
                <th className="px-4 py-3 font-bold">Flags</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No patients found.</td></tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className={`border-t border-app hover:bg-app/60 ${p.archived ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">{p.patientNo}</td>
                    <td className="px-4 py-3">
                      <a href={`/admin/patients/${p.id}`} className="font-semibold text-medical-deepteal hover:underline">{p.name}</a>
                      {p.archived && <span className="ml-2 text-xs text-muted">(archived)</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{p.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{ageFromDob(p.dob)}{p.sex ? ` · ${p.sex[0].toUpperCase()}` : ""}</td>
                    <td className="px-4 py-3">
                      {p.allergies ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">Allergy</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <a href={`/admin/patients/${p.id}`} className="px-3 py-1.5 rounded-lg text-medical-deepteal hover:bg-medical-mint font-semibold">Open</a>
                        <button onClick={() => { setEditing(p); setFormOpen(true); }} className="px-3 py-1.5 rounded-lg text-muted hover:bg-app font-semibold">Edit</button>
                        <button onClick={() => toggleArchive(p)} className="px-3 py-1.5 rounded-lg text-muted hover:bg-app font-semibold">{p.archived ? "Restore" : "Archive"}</button>
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
        <PatientForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
