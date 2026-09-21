import AdminShell from "@/components/admin/AdminShell";
import AppointmentsDay from "@/components/admin/AppointmentsDay";

export const dynamic = "force-dynamic";

export default function AdminAppointmentsPage() {
  return (
    <AdminShell>
      <AppointmentsDay />
    </AdminShell>
  );
}
