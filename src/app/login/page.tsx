import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section aria-labelledby="login-title" className="auth-card">
        <p className="eyebrow">Sistema de hospedaje</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Ingresa con la cuenta que te proporcionó el administrador.</p>
        <LoginForm inactive={error === "inactive"} />
      </section>
    </main>
  );
}
