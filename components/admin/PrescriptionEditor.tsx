"use client";

import { useEffect, useState } from "react";
import {
  ageFromDob, longDate, type Medicine, type RxLine,
  type EyeRx, emptyRefraction, emptyFindings, refractionHasData, findingsHasData,
  DOCTOR_NAME, DOCTOR_TITLE, EYE_HEALTH_QUOTE,
} from "@/lib/pms-types";

type P = { id: number; name: string; dob: string | null; sex: string | null; patientNo: string; phone: string; allergies: string | null };

const TEAL = "#0F766E";
const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function PrescriptionEditor({ patient, letterhead }: { patient: P; letterhead: string | null }) {
  const [notes, setNotes] = useState("");
  const [nextReview, setNextReview] = useState("");
  const [lines, setLines] = useState<RxLine[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [showRefraction, setShowRefraction] = useState(false);
  const [refraction, setRefraction] = useState(emptyRefraction());
  const [showFindings, setShowFindings] = useState(false);
  const [findings, setFindings] = useState(emptyFindings());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = todayISO();

  useEffect(() => {
    const q = search.trim();
    if (!q) { setResults([]); return; }
    const t = setTimeout(async () => {
      const d = await fetch("/api/medicines?pageSize=8&q=" + encodeURIComponent(q)).then((r) => r.json());
      setResults(d.medicines ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [search]);

  const addLine = (name: string) => { setLines((p) => [...p, { medicineName: name, note: "" }]); setSearch(""); setResults([]); };
  const addNew = async () => {
    const name = search.trim(); if (!name) return;
    await fetch("/api/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    addLine(name);
  };
  const setNote = (i: number, note: string) => setLines((p) => p.map((l, idx) => (idx === i ? { ...l, note } : l)));
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));
  const setEye = (side: "right" | "left", field: keyof EyeRx, val: string) => setRefraction((p) => ({ ...p, [side]: { ...p[side], [field]: val } }));
  const setFinding = (row: "iop" | "slitLamp" | "fundus", side: "right" | "left", val: string) => setFindings((p) => ({ ...p, [row]: { ...p[row], [side]: val } }));

  async function saveAndPrint() {
    if (lines.length === 0 && !notes.trim() && !refractionHasData(refraction) && !findingsHasData(findings)) {
      setError("Add a medicine, note, or exam entry."); return;
    }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id, notes, nextReview, items: lines,
          refraction: showRefraction ? refraction : null,
          findings: showFindings ? findings : null,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to save."); return; }
      setTimeout(() => window.print(), 100);
    } finally { setSaving(false); }
  }

  const exactMatch = results.some((m) => m.name.toLowerCase() === search.trim().toLowerCase());
  const showRefrTable = refractionHasData(refraction);
  const showFindTable = findingsHasData(findings);

  const inp = "px-3 py-2 rounded-lg border border-app bg-surface outline-none focus:ring-2 focus:ring-medical-deepteal text-sm";
  const cell = { border: "1px solid #bbb", padding: "5px 8px", fontSize: "12px" } as const;
  const headCell = { ...cell, background: "#edf7f5", color: TEAL, fontWeight: 600 } as const;

  return (
    <div className="min-h-screen bg-app text-app">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          body * { visibility: hidden !important; }
          #rx-sheet, #rx-sheet * { visibility: visible !important; }
          #rx-sheet { position: absolute; left: 0; top: 0; width: 100%; min-height: 262mm !important; padding: 0 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-app">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <a href={`/admin/patients/${patient.id}`} className="text-sm font-semibold text-medical-deepteal hover:underline">← {patient.name}</a>
          <button onClick={saveAndPrint} disabled={saving} className="px-5 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 disabled:opacity-60 text-white font-bold">
            {saving ? "Saving…" : "Save & Print"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* ---------- Editor ---------- */}
        <div className="no-print space-y-5">
          <h1 className="text-2xl font-extrabold">New Prescription</h1>
          {patient.allergies && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 p-3 text-sm font-bold text-red-700 dark:text-red-400">⚠ Allergies: {patient.allergies}</div>
          )}

          {/* Eye power */}
          <Section title="Eye Power (Refraction)" on={showRefraction} toggle={() => setShowRefraction((v) => !v)}>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead><tr className="text-muted text-xs uppercase">
                  <th className="text-left font-bold py-1">Eye</th>{["SPH", "CYL", "AXIS", "V/A", "ADD"].map((h) => <th key={h} className="font-bold px-1">{h}</th>)}
                </tr></thead>
                <tbody>
                  {(["right", "left"] as const).map((side) => (
                    <tr key={side}>
                      <td className="py-1 pr-2 font-semibold">{side === "right" ? "Right" : "Left"}</td>
                      {(["sph", "cyl", "axis", "va", "add"] as const).map((f) => (
                        <td key={f} className="px-0.5"><input value={refraction[side][f]} onChange={(e) => setEye(side, f, e.target.value)} className={`${inp} w-full px-2 py-1.5`} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input value={refraction.ipd} onChange={(e) => setRefraction((p) => ({ ...p, ipd: e.target.value }))} placeholder="IPD (mm)" className={inp} />
              <input value={refraction.remarks} onChange={(e) => setRefraction((p) => ({ ...p, remarks: e.target.value }))} placeholder="Remarks (e.g. bifocal, constant use)" className={inp} />
            </div>
          </Section>

          {/* Clinical findings */}
          <Section title="Clinical Findings" on={showFindings} toggle={() => setShowFindings((v) => !v)}>
            <div className="space-y-2">
              {([["iop", "IOP"], ["slitLamp", "Slit Lamp / Ant. Segment"], ["fundus", "Fundus / Retina"]] as const).map(([key, label]) => (
                <div key={key} className="grid grid-cols-2 gap-2 items-center">
                  <div className="col-span-2 text-xs font-bold uppercase text-muted">{label}</div>
                  <input value={findings[key].right} onChange={(e) => setFinding(key, "right", e.target.value)} placeholder="Right eye" className={inp} />
                  <input value={findings[key].left} onChange={(e) => setFinding(key, "left", e.target.value)} placeholder="Left eye" className={inp} />
                </div>
              ))}
            </div>
          </Section>

          {/* Medicines */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Add Medicine</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a medicine name…" className={`${inp} w-full px-4 py-2.5`} />
            {search.trim() && (
              <div className="mt-1 border border-app rounded-xl overflow-hidden divide-y divide-[color:var(--border)]">
                {results.map((m) => <button key={m.id} onClick={() => addLine(m.name)} className="w-full text-left px-4 py-2.5 hover:bg-app font-medium">{m.name}</button>)}
                {!exactMatch && <button onClick={addNew} className="w-full text-left px-4 py-2.5 hover:bg-app text-medical-deepteal font-semibold">➕ Add “{search.trim()}” to the list</button>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            {lines.length === 0 ? <p className="text-muted text-sm">No medicines added yet.</p> : lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface border border-app rounded-xl p-2">
                <span className="font-bold px-2 shrink-0 max-w-[40%] truncate">{l.medicineName}</span><span className="text-muted">-</span>
                <input value={l.note} onChange={(e) => setNote(i, e.target.value)} placeholder="dosage / instructions" className="flex-1 px-2 py-1.5 rounded-lg border border-app bg-app outline-none text-sm" />
                <button onClick={() => removeLine(i)} aria-label="Remove" className="text-muted hover:text-red-600 px-2 shrink-0">×</button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Notes / Advice</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inp} w-full px-4 py-2.5`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">Next Visit / Review</label>
            <input value={nextReview} onChange={(e) => setNextReview(e.target.value)} placeholder="e.g. after 2 weeks / 2026-10-20" className={`${inp} w-full px-4 py-2.5`} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* ---------- A4 preview ---------- */}
        <div>
          <p className="no-print text-xs font-bold uppercase tracking-wide text-muted mb-2">Preview</p>
          <div id="rx-sheet" className="bg-white text-black shadow-lg mx-auto" style={{ width: "100%", maxWidth: "210mm", minHeight: "297mm", padding: "12mm 14mm", boxSizing: "border-box", fontFamily: "'Helvetica Neue', Arial, sans-serif", display: "flex", flexDirection: "column" }}>
            {letterhead ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={letterhead} alt="Letterhead" style={{ width: "100%", height: "auto", maxHeight: "70mm", objectFit: "contain", display: "block", marginBottom: "10px" }} />
            ) : (
              <div style={{ textAlign: "center", color: "#aaa", borderBottom: `2px solid ${TEAL}`, paddingBottom: "8px", marginBottom: "10px", fontSize: "12px" }}>[ No letterhead — add one in Settings ]</div>
            )}

            {/* Patient bar */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "4px 14px", border: "1px solid #d0d7de", background: "#f8fafc", borderRadius: "4px", padding: "8px 12px", fontSize: "12px", marginBottom: "12px" }}>
              <span><b>Patient:</b> {patient.name}</span>
              <span><b>Age/Sex:</b> {ageFromDob(patient.dob) || "—"}{patient.sex ? ` / ${patient.sex[0].toUpperCase()}` : ""}</span>
              <span><b>Date:</b> {longDate(today)}</span>
              <span style={{ gridColumn: "span 3" }}><b>Contact:</b> {patient.phone}</span>
            </div>

            {patient.allergies && <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: "12px", marginBottom: "8px" }}>Allergies: {patient.allergies}</div>}

            {/* Refraction table */}
            {showRefrTable && (
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0 12px" }}>
                <thead><tr>
                  <th style={{ ...headCell, textAlign: "left" }}>Refraction</th>
                  {["SPH", "CYL", "AXIS", "V/A", "ADD"].map((h) => <th key={h} style={headCell}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(["right", "left"] as const).map((side) => (
                    <tr key={side}>
                      <td style={{ ...cell, fontWeight: 600 }}>{side === "right" ? "Right (O.D.)" : "Left (O.S.)"}</td>
                      {(["sph", "cyl", "axis", "va", "add"] as const).map((f) => <td key={f} style={{ ...cell, textAlign: "center" }}>{refraction[side][f] || ""}</td>)}
                    </tr>
                  ))}
                </tbody>
                {(refraction.ipd || refraction.remarks) && (
                  <tfoot><tr><td colSpan={6} style={{ ...cell, fontSize: "11px", color: "#444" }}>
                    {refraction.ipd ? <b>IPD:</b> : null} {refraction.ipd}{refraction.ipd && refraction.remarks ? "   •   " : ""}{refraction.remarks ? <b>Remarks:</b> : null} {refraction.remarks}
                  </td></tr></tfoot>
                )}
              </table>
            )}

            {/* Findings table */}
            {showFindTable && (
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0 12px" }}>
                <thead><tr>
                  <th style={{ ...headCell, textAlign: "left", width: "28%" }}>Evaluation</th>
                  <th style={headCell}>Right Eye (O.D.)</th><th style={headCell}>Left Eye (O.S.)</th>
                </tr></thead>
                <tbody>
                  {([["iop", "Intraocular Pressure"], ["slitLamp", "Slit Lamp / Ant. Segment"], ["fundus", "Fundus / Retina"]] as const).map(([k, label]) => (
                    (findings[k].right || findings[k].left) ? (
                      <tr key={k}>
                        <td style={{ ...cell, fontWeight: 600 }}>{label}</td>
                        <td style={cell}>{findings[k].right}</td><td style={cell}>{findings[k].left}</td>
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            )}

            {/* Rx */}
            <div style={{ fontSize: "26px", fontWeight: "bold", color: TEAL, fontFamily: "serif", margin: "6px 0 4px" }}>℞</div>
            <div style={{ flex: 1, minHeight: "140px" }}>
              {lines.map((l, i) => (
                <div key={i} style={{ fontSize: "14px", marginBottom: "6px" }}>
                  <b>{l.medicineName}</b>{l.note.trim() ? ` - ${l.note}` : ""}
                </div>
              ))}
              {notes.trim() && <div style={{ fontSize: "13px", marginTop: "12px", whiteSpace: "pre-wrap" }}><b>Advice: </b>{notes}</div>}
              {nextReview.trim() && <div style={{ fontSize: "13px", marginTop: "10px" }}><b>Next Visit / Review: </b>{nextReview}</div>}
            </div>

            {/* Signature + footer */}
            <div style={{ borderTop: `1.5px solid ${TEAL}`, marginTop: "18px", paddingTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontStyle: "italic", color: TEAL, fontSize: "11.5px", maxWidth: "58%" }}>“{EYE_HEALTH_QUOTE}”</div>
                <div style={{ textAlign: "center", minWidth: "210px" }}>
                  <div style={{ height: "34px" }} />
                  <div style={{ borderTop: "1px solid #333", paddingTop: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{DOCTOR_NAME}</div>
                    <div style={{ fontSize: "11px", color: "#555" }}>{DOCTOR_TITLE}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "10px", color: "#777", marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "6px" }}>
                Please bring this prescription on follow-up visits. For sudden eye pain, redness, or vision loss, contact the OPD immediately.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, on, toggle, children }: { title: string; on: boolean; toggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-app rounded-xl">
      <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-3 font-semibold">
        <span>{title}</span>
        <span className={`text-xs px-2 py-1 rounded-lg ${on ? "bg-medical-deepteal text-white" : "bg-app text-muted"}`}>{on ? "On" : "Add"}</span>
      </button>
      {on && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
