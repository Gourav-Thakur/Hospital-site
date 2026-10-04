import AdminShell from "@/components/admin/AdminShell";
import SettingsPanel from "@/components/admin/SettingsPanel";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <SettingsPanel />
    </AdminShell>
  );
}
