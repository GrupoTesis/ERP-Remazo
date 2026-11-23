import { Dashboard } from "@/components/dashboard";
import { RoomBoard } from "@/features/rooms/room-board";
import { getRooms } from "@/features/rooms/queries";
import { ShiftControls } from "@/features/shifts/shift-controls";
import { getActiveShift } from "@/features/shifts/queries";
import { requireRole } from "@/lib/permissions/require-role";

export default async function ReceptionPage() {
  const { user, role } = await requireRole(["recepcion"]);
  const [shift, rooms] = await Promise.all([
    role === "recepcion" ? getActiveShift(user.id, "recepcion") : Promise.resolve(null),
    getRooms(),
  ]);

  return (
    <>
      <Dashboard
        description="Este es el panel central de recepción."
        email={user.email ?? ""}
        role={role}
        title="Panel central"
      />
      {role === "recepcion" && <ShiftControls role={role} shift={shift} />}
      <RoomBoard role={role} rooms={rooms} />
    </>
  );
}
