import {
  pgTable,
  serial,
  text,
  date,
  time,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Legacy: original marketing-site appointment booking (kept so existing admin
// keeps working; superseded by the PMS `appointment` table below).
// ---------------------------------------------------------------------------
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  branch: text("branch").notNull(),
  preferredDate: date("preferred_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

// ---------------------------------------------------------------------------
// PMS Phase 1 — single-doctor clinic (Chiraundi). One admin login (env-based
// auth, no user table). Times stored UTC, shown in Asia/Kolkata.
// ---------------------------------------------------------------------------

export const patient = pgTable(
  "patient",
  {
    id: serial("id").primaryKey(),
    patientNo: text("patient_no").notNull().unique(), // e.g. VH-000123
    name: text("name").notNull(),
    dob: date("dob"),
    sex: text("sex"), // male | female | other
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address"),
    emergencyContact: text("emergency_contact"),
    bloodGroup: text("blood_group"),
    allergies: text("allergies"),
    conditions: text("conditions"),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
  },
  (t) => ({
    phoneIdx: index("patient_phone_idx").on(t.phone),
    nameIdx: index("patient_name_idx").on(t.name),
  })
);

export const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  weekday: integer("weekday").notNull(), // 0 (Sun) – 6 (Sat)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotsPerHour: integer("slots_per_hour").notNull().default(4),
  active: boolean("active").notNull().default(true),
});

export const scheduleException = pgTable("schedule_exception", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: time("start_time"), // null = full day
  endTime: time("end_time"),
  type: text("type").notNull(), // leave | holiday | extra_hours
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointment = pgTable(
  "appointment",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patient.id),
    date: date("date").notNull(),
    intervalStart: time("interval_start").notNull(),
    intervalEnd: time("interval_end").notNull(),
    position: integer("position").notNull(), // 1..N (FCFS) within the interval
    type: text("type").notNull().default("new"), // new | follow_up
    reason: text("reason"),
    status: text("status").notNull().default("scheduled"), // scheduled | checked_in | in_consultation | completed | cancelled | no_show
    cancelReason: text("cancel_reason"),
    rescheduledFrom: timestamp("rescheduled_from", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by"),
  },
  (t) => ({
    // Capacity + no-double-booking: at most one appointment per (date, interval, position)
    // among ACTIVE statuses. Cancel/no-show frees the position immediately.
    activeSlot: uniqueIndex("appt_active_slot_idx")
      .on(t.date, t.intervalStart, t.position)
      .where(sql`status not in ('cancelled', 'no_show')`),
    dateIdx: index("appt_date_idx").on(t.date),
  })
);

export const visit = pgTable("visit", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patient.id),
  appointmentId: integer("appointment_id").references(() => appointment.id),
  visitAt: timestamp("visit_at", { withTimezone: true }).notNull().defaultNow(),
  complaint: text("complaint"),
  vitals: jsonb("vitals"), // { bp, pulse, temp, weight, spo2 }
  examination: text("examination"),
  diagnosis: text("diagnosis"),
  advice: text("advice"),
  followUpDate: date("follow_up_date"),
  status: text("status").notNull().default("open"), // open | completed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
});

export const prescriptionImage = pgTable("prescription_image", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visit.id),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Patient = typeof patient.$inferSelect;
export type NewPatient = typeof patient.$inferInsert;
export type PmsAppointment = typeof appointment.$inferSelect;
export type Visit = typeof visit.$inferSelect;
