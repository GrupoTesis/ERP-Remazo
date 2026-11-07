"use server";

import { redirect } from "next/navigation";
import { isAppRole, roleHome } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import type { LoginState } from "@/types/auth";

const invalidCredentialsMessage =
  "No fue posible iniciar sesión. Revisa tus credenciales e intenta de nuevo.";

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return { error: invalidCredentialsMessage };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (signInError) {
    return { error: invalidCredentialsMessage };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return {
      error: "No pudimos verificar tu sesión. Intenta de nuevo más tarde.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error: "No pudimos verificar tu cuenta. Intenta de nuevo más tarde.",
    };
  }

  if (!profile || !profile.active || !isAppRole(profile.role)) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      return {
        error: "No pudimos verificar tu cuenta. Intenta de nuevo más tarde.",
      };
    }
    redirect("/login?error=inactive");
  }

  redirect(roleHome[profile.role]);
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("No fue posible cerrar la sesión. Intenta de nuevo.");
  }

  redirect("/login");
}
