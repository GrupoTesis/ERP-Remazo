import { Dashboard } from "@/components/dashboard";
import { requireOpenReceptionShift } from "@/lib/permissions/require-open-reception-shift";
import { requireRole } from "@/lib/permissions/require-role";

export default async function InventoryPage() {
  const { user, role } = await requireRole(["recepcion"]);

  if (role === "recepcion") {
    await requireOpenReceptionShift(user.id);
  }

  return (
    <Dashboard
      description="Módulo reservado para administración y recepción."
      email={user.email ?? ""}
      role={role}
      title="Inventario"
    />
  );
}
