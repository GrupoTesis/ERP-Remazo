import { Dashboard } from "@/components/dashboard";
import { requireRole } from "@/lib/permissions/require-role";

export default async function CleaningPage() {
  const { user, role } = await requireRole(["limpieza"]);

  return (
    <Dashboard
      description="Desde este panel podrás consultar habitaciones y reportar el fin de la limpieza."
      email={user.email ?? ""}
      mobile
      role={role}
      title="Panel de limpieza"
    />
  );
}
