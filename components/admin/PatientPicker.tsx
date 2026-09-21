"use client";

import { useEffect, useState } from "react";
import { type Patient } from "@/lib/pms-types";
import PatientForm from "./PatientForm";

// Search existing patients or create a new one, then hand the selection back.
export default function PatientPicker({ onSelect }: { onSelect: (p: Patient) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/patients?" + new URLSearchParams(q.trim() ? { q: q.trim() } : {}));
        const d = await res.json();
        setResults(d.patients ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient by name, phone or ID…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-app bg-app focus:ring-2 focus:ring-medical-deepteal outline-none"
        />
        <button onClick={() => setCreating(true)} className="px-4 py-2.5 rounded-xl border border-medical-deepteal text-medical-deepteal font-bold whitespace-nowrap hover:bg-medical-mint">
          + New
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-app divide-y divide-[color:var(--border)]">
        {loading ? (
          <p className="text-muted text-center py-6 text-sm">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-muted text-center py-6 text-sm">No patients. Use “+ New” to create one.</p>
        ) : (
          results.map((p) => (
            <button key={p.id} onClick={() => onSelect(p)} className="w-full text-left px-4 py-3 hover:bg-app flex items-center justify-between gap-3">
              <span>
                <span className="font-semibold">{p.name}</span>
                {p.allergies && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">ALLERGY</span>}
                <span className="block text-sm text-muted">{p.phone} · {p.patientNo}</span>
              </span>
              <span className="text-medical-deepteal font-semibold text-sm">Select →</span>
            </button>
          ))
        )}
      </div>

      {creating && (
        <PatientForm
          onClose={() => setCreating(false)}
          onSaved={(p) => { setCreating(false); onSelect(p); }}
        />
      )}
    </div>
  );
}
