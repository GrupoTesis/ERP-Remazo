import { createClient } from "@/lib/supabase/server";
import type { Room, RoomConfiguration, RoomRate } from "@/types/rooms";

export async function getRooms(): Promise<Room[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, room_number, name, active, status")
    .order("room_number", { ascending: true });

  if (error) {
    throw new Error("No se pudieron consultar las habitaciones.");
  }

  return (data ?? []) as Room[];
}

export async function getRoomConfigurations(): Promise<RoomConfiguration[]> {
  const supabase = await createClient();
  const [roomsResult, ratesResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, room_number, name, active, status")
      .order("room_number", { ascending: true }),
    supabase
      .from("room_rates")
      .select("id, room_id, duration_minutes, price, valid_from, valid_to")
      .is("valid_to", null)
      .order("duration_minutes", { ascending: true }),
  ]);

  if (roomsResult.error) {
    throw new Error("No se pudieron consultar las habitaciones.");
  }

  if (ratesResult.error) {
    throw new Error("No se pudieron consultar las tarifas vigentes.");
  }

  const rooms = (roomsResult.data ?? []) as Room[];
  const rates = (ratesResult.data ?? []) as RoomRate[];

  return rooms.map((room) => ({
    ...room,
    rates: rates.filter((rate) => rate.room_id === room.id),
  }));
}
