import { Dashboard } from "@/components/dashboard";
import { AdminShifts } from "@/features/shifts/admin-shifts";
import { getActiveShift, getOpenShifts } from "@/features/shifts/queries";
import { ShiftControls } from "@/features/shifts/shift-controls";
import { requireRole } from "@/lib/permissions/require-role";

export default async function AdminPage() {
  const { user, role } = await requireRole(["admin"]);
  const [shifts, shift] = await Promise.all([
    getOpenShifts(user.id),
    getActiveShift(user.id, "admin"),
  ]);

  return (
    <>
      <Dashboard
        description="Desde aquí podrás administrar el sistema y consultar sus módulos."
        email={user.email ?? ""}
        role={role}
        title="Panel de administración"
      />
      <ShiftControls role={role} shift={shift} />
      <AdminShifts shifts={shifts} />
    </>
  );
}
