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
