import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/auth";
import type { Shift } from "@/types/shifts";

export async function getActiveShift(
  userId: string,
  role: AppRole,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("id, user_id, role, opened_at, closed_at")
    .eq("user_id", userId)
    .eq("role", role)
    .is("closed_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo consultar el turno activo.");
  }

  return data as Shift | null;
}

export async function getOpenShifts(excludeUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("id, user_id, role, opened_at, closed_at")
    .is("closed_at", null)
    .neq("user_id", excludeUserId)
    .order("opened_at", { ascending: true });

  if (error) {
    throw new Error("No se pudieron consultar los turnos abiertos.");
  }

  return data as Shift[];
}
