export type AppRole = "admin" | "recepcion" | "limpieza";

export type LoginState = {
  error?: string;
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "recepcion" || value === "limpieza";
}
