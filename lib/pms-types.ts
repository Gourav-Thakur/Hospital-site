export type Patient = {
  id: number;
  patientNo: string;
  name: string;
  dob: string | null;
  sex: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  conditions: string | null;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export const SEXES = ["male", "female", "other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export function patientNoFromId(id: number): string {
  return "VH-" + String(id).padStart(6, "0");
}

// ---- Schedule ----
export type WorkingHours = {
  id: number;
  weekday: number; // 0 (Sun) – 6 (Sat)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  slotsPerHour: number;
  active: boolean;
};

export type ScheduleException = {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string | null; // null = full day
  endTime: string | null;
  type: string; // leave | holiday | extra_hours
  reason: string | null;
  createdAt: string;
};

export const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export const EXCEPTION_TYPES = ["leave", "holiday", "extra_hours"] as const;

export const EXCEPTION_LABELS: Record<string, string> = {
  leave: "Leave",
  holiday: "Holiday",
  extra_hours: "Extra hours",
};

// "HH:MM:SS" or "HH:MM" -> "HH:MM"
export function hhmm(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}
