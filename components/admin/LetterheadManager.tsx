"use client";

import { useEffect, useRef, useState } from "react";

export default function LetterheadManager() {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch("/api/settings/letterhead").then((r) => r.json());
      setValue(d.value ?? null);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) { setMsg("Image is too large — keep it under ~1.5 MB."); if (fileRef.current) fileRef.current.value = ""; return; }
    setMsg("Uploading…");
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const res = await fetch("/api/settings/letterhead", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
    const d = await res.json();
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) { setMsg("Letterhead updated."); load(); } else setMsg(d.error || "Upload failed.");
  }

  async function remove() {
    await fetch("/api/settings/letterhead", { method: "DELETE" });
    setMsg("Letterhead removed.");
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold">Prescription Letterhead</h2>
        <p className="text-muted">Printed at the top of every prescription (A4). PNG or JPG, under ~1.5 MB. A wide banner image works best.</p>
      </div>

      <div className="bg-surface border border-app rounded-2xl p-6">
        {loading ? (
          <p className="text-muted text-center py-8">Loading…</p>
        ) : value ? (
          <div>
            <div className="border border-app rounded-xl overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Letterhead" className="w-full object-contain" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => fileRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-medical-deepteal hover:bg-teal-800 text-white font-bold">Replace</button>
              <button onClick={remove} className="px-4 py-2.5 rounded-xl border border-app font-semibold text-red-600">Remove</button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted mb-4">No letterhead yet. Prescriptions will print without a header until you add one.</p>
            <button onClick={() => fileRef.current?.click()} className="px-5 py-3 rounded-xl bg-medical-deepteal hover:bg-teal-800 text-white font-bold">Upload Letterhead</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onUpload} />
        {msg && <p className="text-sm text-medical-deepteal mt-4">{msg}</p>}
      </div>
    </div>
  );
}
