import type { AppRole } from "@/types/auth";

export { isAppRole } from "@/types/auth";

export const roleHome: Record<AppRole, string> = {
  admin: "/admin",
  recepcion: "/recepcion",
  limpieza: "/limpieza",
};

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  recepcion: "Recepción",
  limpieza: "Limpieza",
};
