import { Dashboard } from "@/components/dashboard";
import { ShiftControls } from "@/features/shifts/shift-controls";
import { getActiveShift } from "@/features/shifts/queries";
import { requireRole } from "@/lib/permissions/require-role";

export default async function ReceptionPage() {
  const { user, role } = await requireRole(["recepcion"]);
  const shift =
    role === "recepcion" ? await getActiveShift(user.id, "recepcion") : null;

  return (
    <>
      <Dashboard
        description="Este es el panel central de recepción."
        email={user.email ?? ""}
        role={role}
        title="Panel central"
      />
      {role === "recepcion" && <ShiftControls role={role} shift={shift} />}
    </>
  );
}
