"use client";

import { useRouter, usePathname } from "next/navigation";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/appointments", label: "Appointments" },
    { href: "/admin/schedule", label: "Schedule" },
  ];

  return (
    <div className="min-h-screen bg-app text-app">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-app">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Logo className="hidden sm:flex" />
            <span className="px-2.5 py-1 rounded-lg bg-medical-mint text-medical-deepteal text-xs font-bold uppercase tracking-wide">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <a
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active ? "bg-medical-deepteal text-white" : "text-muted hover:text-medical-deepteal"
                  }`}
                >
                  {n.label}
                </a>
              );
            })}
            <ThemeToggle className="ml-1" />
            <button
              onClick={logout}
              className="ml-1 px-3 py-2 rounded-lg text-sm font-semibold text-muted hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
