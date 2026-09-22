"use client";

import { useRouter, usePathname } from "next/navigation";
import Logo from "../Logo";
import ThemeToggle from "../ThemeToggle";

const nav = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/patients", label: "Patients", short: "Patients", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M13 12a4 4 0 10-4-4 4 4 0 004 4z" },
  { href: "/admin/appointments", label: "Appointments", short: "Appts", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/schedule", label: "Schedule", short: "Schedule", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-app text-app">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-app"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className="px-2.5 py-1 rounded-lg bg-medical-mint text-medical-deepteal text-xs font-bold uppercase tracking-wide">
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive(n.href) ? "bg-medical-deepteal text-white" : "text-muted hover:text-medical-deepteal"
                }`}
              >
                {n.label}
              </a>
            ))}
            <ThemeToggle className="ml-1" />
            <button onClick={logout} className="ml-1 px-3 py-2 rounded-lg text-sm font-semibold text-muted hover:text-red-600 transition-colors">
              Logout
            </button>
          </nav>

          {/* Mobile: theme + logout only (nav is the bottom bar) */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <button onClick={logout} aria-label="Logout" className="p-2 rounded-lg text-muted hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding on phone to clear the tab bar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:py-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-app"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-4">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <a key={n.href} href={n.href} className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-medical-deepteal" : "text-muted"}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={n.icon} /></svg>
                {n.short}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
