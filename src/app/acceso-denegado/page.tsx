import Link from "next/link";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const verificationFailed = error === "verificacion";

  return (
    <main className="denied">
      <p className="eyebrow">Acceso restringido</p>
      <h1>{verificationFailed ? "No se pudo verificar el acceso" : "Acceso denegado"}</h1>
      <p>
        {verificationFailed
          ? "No fue posible comprobar los permisos de la cuenta. Intenta de nuevo más tarde."
          : "Tu cuenta no tiene permiso para abrir esta sección."}
      </p>
      <Link href="/login">Volver al inicio de sesión</Link>
    </main>
  );
}
