"use client";

import { useEffect, useState } from "react";
import { ageFromDob, longDate, type Medicine, type RxLine } from "@/lib/pms-types";

type P = { id: number; name: string; dob: string | null; sex: string | null; patientNo: string; phone: string; allergies: string | null };

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default function PrescriptionEditor({ patient, letterhead }: { patient: P; letterhead: string | null }) {
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<RxLine[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = todayISO();

  // Typeahead over the medicine list.
  useEffect(() => {
    const q = search.trim();
    if (!q) { setResults([]); return; }
    const t = setTimeout(async () => {
      const d = await fetch("/api/medicines?pageSize=8&q=" + encodeURIComponent(q)).then((r) => r.json());
      setResults(d.medicines ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [search]);

  function addLine(name: string) {
    setLines((prev) => [...prev, { medicineName: name, note: "" }]);
    setSearch("");
    setResults([]);
  }

  async function addNew() {
    const name = search.trim();
    if (!name) return;
    await fetch("/api/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    addLine(name);
  }

  function setNote(i: number, note: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, note } : l)));
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveAndPrint() {
    if (lines.length === 0 && !notes.trim()) { setError("Add at least one medicine or a note."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, notes, items: lines }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to save."); return; }
      setTimeout(() => window.print(), 100);
    } finally {
      setSaving(false);
    }
  }

  const exactMatch = results.some((m) => m.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-app text-app">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #rx-sheet, #rx-sheet * { visibility: visible !important; }
          #rx-sheet { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-app">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <a href={`/admin/patients/${patient.id}`} className="text-sm font-semibold text-medical-deepteal hover:underline">← {patient.name}</a>
          <button onClick={saveAndPrint} disabled={saving} className="px-5 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold">
            {saving ? "Saving…" : "Save & Print"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="no-print space-y-5">
          <h1 className="text-2xl font-extrabold">New Prescription</h1>

          {patient.allergies && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 p-3 text-sm font-bold text-red-700 dark:text-red-400">
              ⚠ Allergies: {patient.allergies}
            </div>
          )}

          {/* Medicine search / add */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Add Medicine</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a medicine name…"
              className="w-full px-4 py-2.5 rounded-xl border border-app bg-surface outline-none focus:ring-2 focus:ring-medical-deepteal" />
            {search.trim() && (
              <div className="mt-1 border border-app rounded-xl overflow-hidden divide-y divide-[color:var(--border)]">
                {results.map((m) => (
                  <button key={m.id} onClick={() => addLine(m.name)} className="w-full text-left px-4 py-2.5 hover:bg-app font-medium">{m.name}</button>
                ))}
                {!exactMatch && (
                  <button onClick={addNew} className="w-full text-left px-4 py-2.5 hover:bg-app text-medical-deepteal font-semibold">➕ Add “{search.trim()}” to the list</button>
                )}
              </div>
            )}
          </div>

          {/* Lines */}
          <div className="space-y-2">
            {lines.length === 0 ? (
              <p className="text-muted text-sm">No medicines added yet.</p>
            ) : (
              lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface border border-app rounded-xl p-2">
                  <span className="font-bold px-2 shrink-0 max-w-[40%] truncate">{l.medicineName}</span>
                  <span className="text-muted">-</span>
                  <input value={l.note} onChange={(e) => setNote(i, e.target.value)} placeholder="dosage / instructions"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-app bg-app outline-none text-sm" />
                  <button onClick={() => removeLine(i)} aria-label="Remove" className="text-muted hover:text-red-600 px-2 shrink-0">×</button>
                </div>
              ))
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Notes / Advice</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="General advice, follow-up, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-app bg-surface outline-none focus:ring-2 focus:ring-medical-deepteal" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Print preview (A4 sheet) */}
        <div>
          <p className="no-print text-xs font-bold uppercase tracking-wide text-muted mb-2">Preview</p>
          <div id="rx-sheet" className="bg-white text-black rounded-sm shadow-lg mx-auto p-[12mm]" style={{ width: "100%", maxWidth: "210mm", minHeight: "297mm" }}>
            {letterhead ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={letterhead} alt="Letterhead" className="w-full object-contain mb-4" />
            ) : (
              <div className="text-center text-gray-400 border-b border-gray-300 pb-3 mb-4 text-sm">[ No letterhead — add one in Settings ]</div>
            )}

            <div className="flex justify-between text-sm border-b border-gray-300 pb-3 mb-4">
              <div>
                <div><span className="font-semibold">{patient.name}</span>{patient.sex || patient.dob ? `  (${ageFromDob(patient.dob)}${patient.dob && patient.sex ? ", " : ""}${patient.sex ?? ""})` : ""}</div>
                <div className="text-gray-600">{patient.patientNo} · {patient.phone}</div>
              </div>
              <div className="text-right text-gray-600">{longDate(today)}</div>
            </div>

            {patient.allergies && (
              <div className="text-sm font-bold text-red-700 mb-3">Allergies: {patient.allergies}</div>
            )}

            <div className="text-2xl font-serif mb-3">℞</div>

            <div className="space-y-2 mb-6 min-h-[120px]">
              {lines.map((l, i) => (
                <div key={i} className="text-[15px]">
                  <span className="font-bold">{l.medicineName}</span>
                  {l.note.trim() ? <span> - {l.note}</span> : null}
                </div>
              ))}
            </div>

            {notes.trim() && (
              <div className="text-sm mb-8 whitespace-pre-wrap">
                <span className="font-semibold">Advice: </span>{notes}
              </div>
            )}

            <div className="mt-16 flex justify-end">
              <div className="text-center text-sm text-gray-700 border-t border-gray-400 pt-1 w-48">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
