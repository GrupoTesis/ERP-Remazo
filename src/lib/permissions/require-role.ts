import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAppRole } from "@/types/auth";
import type { AppRole } from "@/types/auth";

export async function requireRole(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("No se pudo verificar el rol de la cuenta.");
  }

  if (!profile || !profile.active || !isAppRole(profile.role)) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error("No se pudo cerrar la sesión de una cuenta inactiva.");
    }
    redirect("/login?error=inactive");
  }

  if (profile.role !== "admin" && !allowedRoles.includes(profile.role)) {
    redirect("/acceso-denegado");
  }

  return { user, role: profile.role };
}
