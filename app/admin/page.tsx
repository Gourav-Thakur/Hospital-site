import AdminShell from "@/components/admin/AdminShell";
import Dashboard from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}
