export type Appointment = {
  id: number;
  name: string;
  phone: string;
  branch: string;
  preferredDate: string; // YYYY-MM-DD
  notes: string | null;
  status: string; // confirmed | cancelled
  createdAt: string;
};

export const BRANCHES = ["Bariatu Rd", "Chiraundi"] as const;
export const STATUSES = ["confirmed", "cancelled"] as const;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
