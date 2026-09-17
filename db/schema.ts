import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";

// v1: appointments are created manually by staff in the admin panel.
// Future (public booking queue) will add statuses like `pending_request` and a `priority` flag.
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  branch: text("branch").notNull(), // "Bariatu Rd" | "Chiraundi"
  preferredDate: date("preferred_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("confirmed"), // confirmed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
