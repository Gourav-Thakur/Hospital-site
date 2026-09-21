import AdminShell from "@/components/admin/AdminShell";
import ScheduleManager from "@/components/admin/ScheduleManager";

export const dynamic = "force-dynamic";

export default function AdminSchedulePage() {
  return (
    <AdminShell>
      <ScheduleManager />
    </AdminShell>
  );
}
