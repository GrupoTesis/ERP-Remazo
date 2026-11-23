import { Dashboard } from "@/components/dashboard";
import { RoomManagement } from "@/features/rooms/room-management";
import { getRoomConfigurations } from "@/features/rooms/queries";
import { requireRole } from "@/lib/permissions/require-role";

export default async function RoomsAdminPage() {
  const { user, role } = await requireRole(["admin"]);
  const rooms = await getRoomConfigurations();

  return (
    <>
      <Dashboard
        description="Configura las habitaciones y las tarifas vigentes por duración."
        email={user.email ?? ""}
        role={role}
        title="Habitaciones y tarifas"
      />
      <RoomManagement rooms={rooms} />
    </>
  );
}
