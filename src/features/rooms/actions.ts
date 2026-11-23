"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAppRole } from "@/types/auth";
import type { RoomActionState, RoomStatus } from "@/types/rooms";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const roomStatuses: RoomStatus[] = ["disponible", "ocupada", "limpieza"];

async function getActiveRoomUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Tu sesión no está activa. Inicia sesión nuevamente." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active, reauth_required")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.active ||
    profile.reauth_required ||
    !isAppRole(profile.role)
  ) {
    return { error: "No se pudo verificar el usuario y su rol." };
  }

  return { supabase, user, role: profile.role };
}

function logRoomActionError(action: string, error: {
  code: string;
  message: string;
  details: string;
  hint: string;
}) {
  console.error(`No se pudo ejecutar ${action}:`, error);
}

function actionError(
  action: string,
  error: { code: string; message: string; details: string; hint: string },
  fallback: string,
): RoomActionState {
  logRoomActionError(action, error);
  return {
    error:
      error.code === "P0001" || error.code === "23514"
        ? error.message
        : fallback,
  };
}

export async function updateRoomDetailsAction(
  _previousState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const context = await getActiveRoomUser();
  if ("error" in context) return { error: context.error };
  if (context.role !== "admin") {
    return { error: "Solo un administrador puede editar habitaciones." };
  }

  const roomId = formData.get("roomId");
  const roomNumber = Number(formData.get("roomNumber"));
  const name = formData.get("name");

  if (
    typeof roomId !== "string" ||
    !uuidPattern.test(roomId) ||
    !Number.isInteger(roomNumber) ||
    roomNumber < 1 ||
    roomNumber > 6 ||
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 80
  ) {
    return { error: "Revisa el número y nombre de la habitación." };
  }

  const { error } = await context.supabase
    .from("rooms")
    .update({ room_number: roomNumber, name: name.trim() })
    .eq("id", roomId);

  if (error) {
    return actionError(
      "la actualización de habitación",
      error,
      "No se pudo guardar la habitación. Verifica que el número no esté repetido.",
    );
  }

  revalidatePath("/admin/habitaciones");
  revalidatePath("/recepcion");
  return { success: true, message: "Habitación actualizada." };
}

export async function setRoomRateAction(
  _previousState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const context = await getActiveRoomUser();
  if ("error" in context) return { error: context.error };
  if (context.role !== "admin") {
    return { error: "Solo un administrador puede configurar tarifas." };
  }

  const roomId = formData.get("roomId");
  const durationMinutes = Number(formData.get("durationMinutes"));
  const price = Number(formData.get("price"));

  if (
    typeof roomId !== "string" ||
    !uuidPattern.test(roomId) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 30 ||
    durationMinutes > 1440 ||
    durationMinutes % 30 !== 0 ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return { error: "La duración o el precio no son válidos." };
  }

  const { error } = await context.supabase.rpc("set_room_rate", {
    p_room_id: roomId,
    p_duration_minutes: durationMinutes,
    p_price: price,
  });

  if (error) {
    return actionError(
      "set_room_rate",
      error,
      "No se pudo guardar la tarifa.",
    );
  }

  revalidatePath("/admin/habitaciones");
  return { success: true, message: "Tarifa guardada. La versión anterior se conserva." };
}

export async function setRoomActiveAction(
  _previousState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const context = await getActiveRoomUser();
  if ("error" in context) return { error: context.error };
  if (context.role !== "admin") {
    return { error: "Solo un administrador puede activar o desactivar habitaciones." };
  }

  const roomId = formData.get("roomId");
  const active = formData.get("active");

  if (
    typeof roomId !== "string" ||
    !uuidPattern.test(roomId) ||
    (active !== "true" && active !== "false")
  ) {
    return { error: "La habitación seleccionada no es válida." };
  }

  const { error } = await context.supabase.rpc("set_room_active", {
    p_room_id: roomId,
    p_active: active === "true",
  });

  if (error) {
    return actionError(
      "set_room_active",
      error,
      "No se pudo cambiar la disponibilidad de la habitación.",
    );
  }

  revalidatePath("/admin/habitaciones");
  revalidatePath("/recepcion");
  return {
    success: true,
    message: active === "true" ? "Habitación activada." : "Habitación desactivada.",
  };
}

export async function changeRoomStatusAction(
  _previousState: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const context = await getActiveRoomUser();
  if ("error" in context) return { error: context.error };

  const roomId = formData.get("roomId");
  const newStatus = formData.get("newStatus");
  const reason = formData.get("reason");

  if (
    typeof roomId !== "string" ||
    !uuidPattern.test(roomId) ||
    typeof newStatus !== "string" ||
    !roomStatuses.includes(newStatus as RoomStatus)
  ) {
    return { error: "La transición seleccionada no es válida." };
  }

  if (
    context.role === "recepcion" &&
    newStatus !== "limpieza"
  ) {
    return { error: "Recepción solo puede confirmar la salida hacia limpieza." };
  }

  if (context.role === "limpieza") {
    return { error: "El tablero de recepción no permite esta acción al personal de limpieza." };
  }

  if (context.role === "admin" && (typeof reason !== "string" || !reason.trim())) {
    return { error: "Indica el motivo de la corrección administrativa." };
  }

  const { error } = await context.supabase.rpc("change_room_status", {
    p_room_id: roomId,
    p_new_status: newStatus,
    p_reason:
      context.role === "admin"
        ? (reason as string).trim()
        : "Salida confirmada presencialmente por el huésped.",
  });

  if (error) {
    return actionError(
      "change_room_status",
      error,
      "No se pudo cambiar el estado de la habitación.",
    );
  }

  revalidatePath("/recepcion");
  revalidatePath("/limpieza");
  revalidatePath("/admin/habitaciones");
  return { success: true, message: "Estado actualizado." };
}
