import AdminShell from "@/components/admin/AdminShell";
import PatientsManager from "@/components/admin/PatientsManager";

export const dynamic = "force-dynamic";

export default function AdminPatientsPage() {
  return (
    <AdminShell>
      <PatientsManager />
    </AdminShell>
  );
}
