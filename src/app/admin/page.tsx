import { Dashboard } from "@/components/dashboard";
import { requireRole } from "@/lib/permissions/require-role";

export default async function AdminPage() {
  const { user, role } = await requireRole(["admin"]);

  return (
    <Dashboard
      description="Desde aquí podrás administrar el sistema y consultar sus módulos."
      email={user.email ?? ""}
      role={role}
      title="Panel de administración"
    />
  );
}
