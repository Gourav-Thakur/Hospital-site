"use client";

import { useEffect, useMemo, useState } from "react";
import { type Appointment, todayISO } from "@/lib/types";

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-app p-6 ${accent ? "bg-medical-deepteal text-white" : "bg-surface"}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className={`mt-1 text-sm font-semibold uppercase tracking-wide ${accent ? "text-medical-mint" : "text-muted"}`}>{label}</div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = todayISO();

  const { stats, todays, upcoming } = useMemo(() => {
    const active = items.filter((a) => a.status !== "cancelled");
    const todays = active.filter((a) => a.preferredDate === today);
    const upcoming = active
      .filter((a) => a.preferredDate > today)
      .sort((a, b) => a.preferredDate.localeCompare(b.preferredDate))
      .slice(0, 6);
    return {
      stats: {
        total: items.length,
        today: todays.length,
        upcoming: active.filter((a) => a.preferredDate >= today).length,
        cancelled: items.filter((a) => a.status === "cancelled").length,
      },
      todays,
      upcoming,
    };
  }, [items, today]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="text-muted">Overview of appointments.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Today" value={loading ? "…" : stats.today} accent />
        <StatCard label="Upcoming" value={loading ? "…" : stats.upcoming} />
        <StatCard label="Total" value={loading ? "…" : stats.total} />
        <StatCard label="Cancelled" value={loading ? "…" : stats.cancelled} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ListCard title="Today's Appointments" items={todays} loading={loading} emptyText="No appointments today." formatDate={formatDate} />
        <ListCard title="Upcoming" items={upcoming} loading={loading} emptyText="No upcoming appointments." formatDate={formatDate} />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  loading,
  emptyText,
  formatDate,
}: {
  title: string;
  items: Appointment[];
  loading: boolean;
  emptyText: string;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="bg-surface border border-app rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <a href="/admin/appointments" className="text-sm font-semibold text-medical-deepteal hover:underline">View all</a>
      </div>
      {loading ? (
        <p className="text-muted py-6 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-[color:var(--border)]">
          {items.map((a) => (
            <li key={a.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold truncate">{a.name}</div>
                <div className="text-sm text-muted truncate">{a.phone} · {a.branch}</div>
              </div>
              <div className="text-sm text-muted whitespace-nowrap">{formatDate(a.preferredDate)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
