import AdminShell from "@/components/admin/AdminShell";
import AppointmentsManager from "@/components/admin/AppointmentsManager";

export const dynamic = "force-dynamic";

export default function AdminAppointmentsPage() {
  return (
    <AdminShell>
      <AppointmentsManager />
    </AdminShell>
  );
}
