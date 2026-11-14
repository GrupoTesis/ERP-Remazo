import { Dashboard } from "@/components/dashboard";
import { ShiftControls } from "@/features/shifts/shift-controls";
import { getActiveShift } from "@/features/shifts/queries";
import { requireRole } from "@/lib/permissions/require-role";

export default async function CleaningPage() {
  const { user, role } = await requireRole(["limpieza"]);
  const shift =
    role === "limpieza" ? await getActiveShift(user.id, "limpieza") : null;

  return (
    <>
      <Dashboard
        description="Desde este panel podrás consultar habitaciones y reportar el fin de la limpieza."
        email={user.email ?? ""}
        mobile
        role={role}
        title="Panel de limpieza"
      />
      {role === "limpieza" && <ShiftControls role={role} shift={shift} />}
    </>
  );
}
