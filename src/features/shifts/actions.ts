"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAppRole } from "@/types/auth";
import type { ShiftActionState } from "@/types/shifts";

async function getActiveUser() {
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

export async function openShiftAction(
  _previousState: ShiftActionState,
): Promise<ShiftActionState> {
  void _previousState;
  const context = await getActiveUser();

  if ("error" in context) {
    return { error: context.error };
  }

  const { error } = await context.supabase.rpc("open_my_shift");

  if (error) {
    console.error("No se pudo ejecutar open_my_shift:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23505") {
      return {
        error:
          context.role === "recepcion"
            ? "Ya hay un turno de recepción abierto. Coordina el relevo antes de abrir otro."
            : context.role === "admin"
              ? "Ya hay un turno de administración abierto."
              : "Ya tienes un turno abierto.",
      };
    }
    if (error.code === "P0001" && error.message.includes("turno")) {
      return { error: error.message };
    }
    return { error: "No se pudo abrir el turno. Intenta de nuevo." };
  }

  revalidatePath("/recepcion");
  revalidatePath("/limpieza");
  revalidatePath("/caja");
  revalidatePath("/inventario");

  return { active: true, message: "Turno abierto correctamente." };
}

export async function closeMyShiftAction(
  _previousState: ShiftActionState,
): Promise<ShiftActionState> {
  void _previousState;
  const context = await getActiveUser();

  if ("error" in context) {
    return { error: context.error };
  }

  const { error } = await context.supabase.rpc("close_my_shift");

  if (error) {
    return {
      error:
        error.code === "P0001"
          ? error.message
          : "No se pudo cerrar el turno. Intenta de nuevo.",
    };
  }

  revalidatePath("/recepcion");
  revalidatePath("/limpieza");
  revalidatePath("/admin");
  revalidatePath("/caja");
  revalidatePath("/inventario");

  const { error: signOutError } = await context.supabase.auth.signOut();

  if (signOutError) {
    return {
      active: false,
      error:
        "El turno se cerró, pero no se pudo cerrar la sesión. Cierra sesión manualmente y vuelve a ingresar.",
    };
  }

  redirect("/login?error=reauth");
}

export async function closeShiftAsAdminAction(
  _previousState: ShiftActionState,
  formData: FormData,
): Promise<ShiftActionState> {
  const context = await getActiveUser();

  if ("error" in context) {
    return { error: context.error };
  }

  if (context.role !== "admin") {
    return { error: "Solo un administrador puede cerrar el turno de otra persona." };
  }

  const shiftId = formData.get("shiftId");
  if (typeof shiftId !== "string" || !/^[0-9a-f-]{36}$/i.test(shiftId)) {
    return { error: "El turno seleccionado no es válido." };
  }

  const { data: userId, error: closeError } = await context.supabase.rpc(
    "admin_close_shift",
    { target_shift_id: shiftId },
  );

  if (closeError || typeof userId !== "string") {
    return { error: "No se pudo cerrar el turno seleccionado." };
  }

  revalidatePath("/admin");
  revalidatePath("/recepcion");
  revalidatePath("/limpieza");
  revalidatePath("/caja");
  revalidatePath("/inventario");

  try {
    const adminClient = createAdminClient();
    const { error: signOutError } = await adminClient.auth.admin.signOut(
      userId,
      "global",
    );

    if (signOutError) {
      return {
        active: false,
        error:
          "El turno se cerró, pero no se pudieron revocar las sesiones. Las operaciones del turno ya están bloqueadas.",
      };
    }
  } catch (error) {
    console.error("No se pudieron revocar las sesiones del usuario:", error);
    return {
      active: false,
      error:
        "El turno se cerró, pero no se pudieron revocar las sesiones. Las operaciones del turno ya están bloqueadas.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/recepcion");
  revalidatePath("/limpieza");
  revalidatePath("/caja");
  revalidatePath("/inventario");

  return { active: false, message: "Turno cerrado y sesiones revocadas." };
}
