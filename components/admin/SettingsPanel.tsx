"use client";

import { useState } from "react";
import ScheduleManager from "./ScheduleManager";
import MedicinesManager from "./MedicinesManager";
import LetterheadManager from "./LetterheadManager";

const TABS = [
  { id: "schedule", label: "Schedule" },
  { id: "medicines", label: "Medicines" },
  { id: "letterhead", label: "Letterhead" },
] as const;

export default function SettingsPanel() {
  const [tab, setTab] = useState<string>("schedule");
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-app overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-medical-deepteal text-medical-deepteal" : "border-transparent text-muted hover:text-app"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "schedule" && <ScheduleManager />}
      {tab === "medicines" && <MedicinesManager />}
      {tab === "letterhead" && <LetterheadManager />}
    </div>
  );
}
