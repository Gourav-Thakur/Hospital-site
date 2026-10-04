"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Medicine } from "@/lib/pms-types";
import Pagination from "./Pagination";

const PAGE_SIZE = 20;

export default function MedicinesManager() {
  const [items, setItems] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPage(1); }, [query, showInactive]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (query.trim()) params.set("q", query.trim());
      if (showInactive) params.set("inactive", "1");
      const res = await fetch("/api/medicines?" + params.toString());
      const d = await res.json();
      setItems(d.medicines ?? []);
      setTotal(d.total ?? 0);
    } finally { setLoading(false); }
  }, [query, showInactive, page]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  async function add() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch("/api/medicines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const d = await res.json();
    if (res.ok) { setNewName(""); setMsg(d.existed ? `"${name}" already exists.` : d.reactivated ? `Reactivated "${name}".` : `Added "${name}".`); load(); }
    else setMsg(d.error || "Failed.");
  }

  async function toggle(m: Medicine) {
    await fetch(`/api/medicines/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !m.active }) });
    load();
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("Importing…");
    const text = await file.text();
    const res = await fetch("/api/medicines/import", { method: "POST", headers: { "Content-Type": "text/csv" }, body: text });
    const d = await res.json();
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) { setMsg(`Imported ${d.added} new, skipped ${d.skipped} duplicates.`); load(); }
    else setMsg(d.error || "Import failed.");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold">Medicines</h2>
        <p className="text-muted">{total} in list. Used by the prescription dropdown.</p>
      </div>

      {/* Add + import/export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-1">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a medicine (e.g. Azithromycin 500)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-app bg-surface outline-none focus:ring-2 focus:ring-medical-deepteal" />
          <button onClick={add} className="px-4 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 text-white font-bold whitespace-nowrap">Add</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app whitespace-nowrap">Import CSV</button>
          <a href="/api/medicines/export" className="px-4 py-2.5 rounded-xl border border-app font-semibold text-muted hover:text-app whitespace-nowrap">Download CSV</a>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
        </div>
      </div>
      {msg && <p className="text-sm text-medical-deepteal mb-3">{msg}</p>}
      <p className="text-xs text-muted mb-4">Download gives the current list (just headers if empty) — fill rows and re-upload to bulk add.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-app bg-surface outline-none focus:ring-2 focus:ring-medical-deepteal" />
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app bg-surface text-sm font-semibold text-muted cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
        </label>
      </div>

      <div className="bg-surface border border-app rounded-2xl divide-y divide-[color:var(--border)]">
        {loading ? (
          <p className="text-muted text-center py-10">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted text-center py-10">No medicines. Add one above or import a CSV.</p>
        ) : (
          items.map((m) => (
            <div key={m.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${m.active ? "" : "opacity-50"}`}>
              <span className="font-medium">{m.name}{!m.active && <span className="ml-2 text-xs text-muted">(inactive)</span>}</span>
              <button onClick={() => toggle(m)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-muted hover:bg-app border border-app">
                {m.active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  );
}
