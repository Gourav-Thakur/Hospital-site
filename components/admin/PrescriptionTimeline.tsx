"use client";

import { useEffect, useState } from "react";
import Pagination from "./Pagination";
import type { Findings, Refraction } from "@/lib/pms-types";

type PrescriptionSummary = {
  id: number;
  createdAt: string;
  notes: string | null;
  nextReview: string | null;
};

type PrescriptionDetail = PrescriptionSummary & {
  refraction: Refraction | null;
  findings: Findings | null;
  items: { id: number; medicineName: string; note: string | null }[];
};

const PAGE_SIZE = 10;

function dateParts(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="min-h-10 whitespace-pre-wrap rounded-lg border border-app bg-app px-3 py-2 text-sm">
        {value?.trim() || "—"}
      </div>
    </div>
  );
}

export default function PrescriptionTimeline({ patientId }: { patientId: number }) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PrescriptionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(`/api/prescriptions?patientId=${patientId}&page=${page}&pageSize=${PAGE_SIZE}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load prescription history.");
        return res.json();
      })
      .then((data) => {
        setPrescriptions(data.prescriptions);
        setTotal(data.total);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load prescription history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [patientId, page, refreshKey]);

  useEffect(() => {
    if (selectedId === null) return;

    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    fetch(`/api/prescriptions/${selectedId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load this prescription.");
        return res.json();
      })
      .then((data) => setDetail({ ...data.prescription, items: data.items }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setDetailError(err instanceof Error ? err.message : "Could not load this prescription.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    if (selectedId === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  const closeDialog = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError("");
    setDeleteError("");
  };

  async function deletePrescription(id: number) {
    if (deletingId !== null) return;
    const confirmed = window.confirm(
      "Delete this prescription and its medicine entries? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Could not delete this prescription.");
      }

      setPrescriptions((current) => current.filter((rx) => rx.id !== id));
      setTotal((current) => Math.max(0, current - 1));
      if (selectedId === id) closeDialog();
      if (prescriptions.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete this prescription.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="bg-surface border border-app rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="text-lg font-bold">Prescription Timeline</h2>
            <p className="text-sm text-muted">{total} saved {total === 1 ? "prescription" : "prescriptions"}</p>
          </div>
        </div>

        {error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="py-6 text-center text-sm text-muted">Loading prescription history…</p>
        ) : prescriptions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No prescriptions have been saved for this patient.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--border)]">
            {prescriptions.map((rx) => {
              const { date, time } = dateParts(rx.createdAt);
              return (
                <li key={rx.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(rx.id)}
                    className="min-w-0 flex-1 flex items-center justify-between gap-4 py-4 text-left hover:text-medical-deepteal"
                  >
                    <span>
                      <span className="block font-semibold">Prescription · {date}</span>
                      <span className="mt-0.5 block text-xs text-muted">Generated {time} · #{rx.id}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-medical-deepteal">View →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePrescription(rx.id)}
                    disabled={deletingId !== null}
                    aria-label={`Delete prescription from ${date}`}
                    className="shrink-0 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                  >
                    {deletingId === rx.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </section>

      {selectedId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="prescription-dialog-title"
            className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-app bg-surface shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-app px-5 py-4 sm:px-7">
              <div>
                <h2 id="prescription-dialog-title" className="text-xl font-extrabold">Saved Prescription</h2>
                {detail && (
                  <p className="mt-1 text-sm text-muted">
                    {dateParts(detail.createdAt).date} · {dateParts(detail.createdAt).time}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {detail && (
                  <button
                    type="button"
                    onClick={() => deletePrescription(selectedId)}
                    disabled={deletingId !== null}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                  >
                    {deletingId === selectedId ? "Deleting…" : "Delete"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDialog}
                  aria-label="Close prescription"
                  className="rounded-lg border border-app px-3 py-1.5 font-semibold text-muted hover:text-app"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="overflow-y-auto p-5 sm:p-7">
              {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}
              {detailLoading ? (
                <p className="py-12 text-center text-muted">Loading prescription…</p>
              ) : detailError ? (
                <p className="py-12 text-center text-red-600">{detailError}</p>
              ) : detail ? (
                <div className="space-y-7">
                  <section>
                    <h3 className="mb-3 text-base font-bold">Medicines</h3>
                    {detail.items.length ? (
                      <div className="space-y-3">
                        {detail.items.map((item, index) => (
                          <div key={item.id} className="grid gap-3 rounded-xl border border-app bg-app p-4 sm:grid-cols-[minmax(0,1fr)_2fr]">
                            <ReadOnlyField label={`Medicine ${index + 1}`} value={item.medicineName} />
                            <ReadOnlyField label="Dosage / Instructions" value={item.note} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-app bg-app p-4 text-sm text-muted">No medicines entered.</p>
                    )}
                  </section>

                  {detail.refraction && (
                    <section>
                      <h3 className="mb-3 text-base font-bold">Eye Power (Refraction)</h3>
                      <div className="overflow-x-auto rounded-xl border border-app">
                        <table className="w-full min-w-[540px] text-left text-sm">
                          <thead className="bg-app text-xs uppercase text-muted">
                            <tr>
                              <th className="px-4 py-3">Eye</th>
                              {["SPH", "CYL", "AXIS", "V/A", "ADD"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {(["right", "left"] as const).map((side) => (
                              <tr key={side} className="border-t border-app">
                                <th className="px-4 py-3 font-semibold capitalize">{side}</th>
                                {(["sph", "cyl", "axis", "va", "add"] as const).map((field) => (
                                  <td key={field} className="px-3 py-3">{detail.refraction?.[side]?.[field] || "—"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <ReadOnlyField label="IPD" value={detail.refraction.ipd} />
                        <ReadOnlyField label="Remarks" value={detail.refraction.remarks} />
                      </div>
                    </section>
                  )}

                  {detail.findings && (
                    <section>
                      <h3 className="mb-3 text-base font-bold">Clinical Findings</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([
                          ["iop", "Intraocular Pressure"],
                          ["slitLamp", "Slit Lamp / Anterior Segment"],
                          ["fundus", "Fundus / Retina"],
                        ] as const).map(([key, label]) => (
                          <div key={key} className="rounded-xl border border-app bg-app p-4">
                            <h4 className="mb-3 text-sm font-bold">{label}</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <ReadOnlyField label="Right eye" value={detail.findings?.[key].right} />
                              <ReadOnlyField label="Left eye" value={detail.findings?.[key].left} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="grid gap-4 sm:grid-cols-2">
                    <ReadOnlyField label="Notes / Advice" value={detail.notes} />
                    <ReadOnlyField label="Next Visit / Review" value={detail.nextReview} />
                  </section>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
