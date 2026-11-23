import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { roleLabels } from "@/lib/permissions/roles";
import type { AppRole } from "@/types/auth";

const roleLinks: Record<AppRole, Array<{ href: string; label: string }>> = {
  admin: [
    { href: "/recepcion", label: "Panel central" },
    { href: "/admin/habitaciones", label: "Habitaciones y tarifas" },
    { href: "/limpieza", label: "Panel de limpieza" },
    { href: "/caja", label: "Caja" },
    { href: "/inventario", label: "Inventario" },
  ],
  recepcion: [
    { href: "/caja", label: "Caja" },
    { href: "/inventario", label: "Inventario" },
  ],
  limpieza: [],
};

export function Dashboard({
  role,
  email,
  title,
  description,
  mobile = false,
}: {
  role: AppRole;
  email: string;
  title: string;
  description: string;
  mobile?: boolean;
}) {
  return (
    <main className={`dashboard${mobile ? " dashboard-mobile" : ""}`}>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{roleLabels[role]}</p>
          <h1>{title}</h1>
          <p className="muted">{email}</p>
        </div>
        <form action={logoutAction}>
          <button className="button button-secondary" type="submit">
            Cerrar sesión
          </button>
        </form>
      </header>
      <section className="panel">
        <h2>Bienvenido</h2>
        <p>{description}</p>
        {roleLinks[role].length > 0 && (
          <nav aria-label="Secciones disponibles" className="link-list">
            {roleLinks[role].map((link) => (
              <Link className="section-link" href={link.href} key={link.href}>
                {link.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        )}
      </section>
    </main>
  );
}
