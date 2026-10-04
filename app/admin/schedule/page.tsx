import { redirect } from "next/navigation";

// Schedule moved under Settings.
export default function LegacyScheduleRedirect() {
  redirect("/admin/settings");
}
