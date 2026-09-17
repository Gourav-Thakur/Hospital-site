"use client";

// Floating bottom call-to-action. Both actions are intentionally DISABLED for now
// ("Coming Soon") — public booking / call features arrive in a later phase.
export default function FloatingCTA() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 pointer-events-none"
    >
      <div className="mx-auto max-w-md flex gap-3 pointer-events-auto">
        <FloatingButton
          label="Book an Appointment"
          className="flex-1 bg-medical-deepteal text-white"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          }
        />
        <FloatingButton
          label="Call Us"
          className="flex-1 bg-surface text-app border border-app"
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          }
        />
      </div>
    </div>
  );
}

function FloatingButton({
  label,
  className,
  icon,
}: {
  label: string;
  className: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      disabled
      title="Coming Soon"
      aria-label={`${label} — coming soon`}
      className={`group relative flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold shadow-lg cursor-not-allowed opacity-90 ${className}`}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {icon}
      </svg>
      <span className="truncate">{label}</span>
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-medical-darkslate text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
        Coming Soon
      </span>
    </button>
  );
}
