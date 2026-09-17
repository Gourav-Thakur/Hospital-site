"use client";

import { useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#locations", label: "Locations" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-surface/95 backdrop-blur-md shadow-sm z-50 border-b border-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <a href="#home" className="flex-shrink-0">
            <Logo />
          </a>

          <nav className="hidden lg:flex space-x-10">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-muted hover:text-medical-deepteal font-semibold transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <button
              disabled
              className="bg-app text-muted px-6 py-2.5 rounded-full font-bold flex items-center gap-2 relative group cursor-not-allowed border border-app"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call Us
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-medical-darkslate text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">Coming Soon</span>
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="text-muted hover:text-medical-deepteal p-2 bg-app rounded-lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-surface border-t border-app px-4 py-4 space-y-2 shadow-lg absolute w-full left-0">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-app font-semibold text-lg py-2 hover:bg-medical-mint hover:text-medical-deepteal px-4 rounded-lg transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 border-t border-app">
            <button disabled className="w-full bg-app text-muted px-6 py-3 rounded-xl font-bold cursor-not-allowed border border-app">
              Call Us (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
