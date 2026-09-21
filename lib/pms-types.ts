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

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

// Deterministic date formatting (no locale/timezone engine) to avoid SSR/client
// hydration mismatches. Input: "YYYY-MM-DD".
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(iso + "T00:00:00Z").getUTCDay();
  return `${WEEKDAYS[dow]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

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

// "16:00" -> "4:00 PM"
export function fmt12(t: string | null): string {
  const s = hhmm(t);
  if (!s) return "";
  const [h, m] = s.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ---- Appointments ----
export type ApptStatus =
  | "scheduled" | "checked_in" | "in_consultation" | "completed" | "cancelled" | "no_show";

export const APPT_TYPES = ["new", "follow_up"] as const;

export const APPT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked-in",
  in_consultation: "In consultation",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export type Appointment = {
  id: number;
  patientId: number;
  date: string;
  intervalStart: string;
  intervalEnd: string;
  position: number;
  type: string;
  reason: string | null;
  status: string;
  cancelReason: string | null;
  createdAt: string;
  // joined patient fields (day view / lists)
  patientName?: string;
  patientPhone?: string;
  patientNo?: string;
  patientAllergies?: string | null;
};

export type AvailInterval = {
  start: string; // "HH:MM"
  end: string;
  capacity: number;
  booked: number;
  free: number;
};

export const MAX_BOOK_DAYS_AHEAD = 90;
