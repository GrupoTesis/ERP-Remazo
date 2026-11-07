import { Dashboard } from "@/components/dashboard";
import { requireRole } from "@/lib/permissions/require-role";

export default async function CashPage() {
  const { user, role } = await requireRole(["recepcion"]);

  return (
    <Dashboard
      description="Módulo reservado para administración y recepción."
      email={user.email ?? ""}
      role={role}
      title="Caja"
    />
  );
}
