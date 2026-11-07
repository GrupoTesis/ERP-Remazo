import { Dashboard } from "@/components/dashboard";
import { requireRole } from "@/lib/permissions/require-role";

export default async function ReceptionPage() {
  const { user, role } = await requireRole(["recepcion"]);

  return (
    <Dashboard
      description="Este es el panel central de recepción."
      email={user.email ?? ""}
      role={role}
      title="Panel central"
    />
  );
}
