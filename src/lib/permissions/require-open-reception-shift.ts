import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireOpenReceptionShift(userId: string) {
  const supabase = await createClient();
  const { data: shift, error } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "recepcion")
    .is("closed_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo verificar el turno de recepción.");
  }

  if (!shift) {
    redirect("/recepcion?turno=requerido");
  }
}
