import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { track, type AnalyticsEvent } from "../analytics/analytics";
import { useAuth } from "../../features/auth/useAuth";

const links: { label: string; href: string; event: AnalyticsEvent; strong?: boolean }[] = [
  { label: "Para centros de estudio", href: "#instituciones", event: "clicked_nav_institutions", strong: true },
  { label: "Para Empresas", href: "#empresas", event: "clicked_nav_companies", strong: true },
  { label: "Para profesionales emergentes", href: "#talento", event: "clicked_nav_talent", strong: true },
  { label: "Cómo funciona", href: "#simulacion", event: "clicked_nav_how_it_works" },
  { label: "Métricas públicas en vivo", href: "#public-dashboard", event: "clicked_nav_public_metrics" },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch {
      track("logout_failed", { role: user?.role ?? "unknown" });
      setSignOutError("No se pudo cerrar sesión. Inténtalo de nuevo.");
      return;
    } finally {
      setSigningOut(false);
    }
    track("logout_succeeded", { role: user?.role ?? "unknown" });
    navigate("/iniciar-sesion", { replace: true });
  };

  return (
    <header className="navbar fixed inset-x-0 top-0 z-50 h-20 border-b border-neutral bg-base-200/90 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between gap-2">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-neutral bg-base-300 text-secondary">
            <span className="material-symbols-outlined">terminal</span>
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xl font-bold text-white">No Country</span>
            <span className="text-gradient text-[11px] font-semibold uppercase tracking-widest">
              Experiencia de trabajo real
            </span>
          </div>
        </Link>

        {!loading && !user && (
          <ul className="hidden items-center gap-8 2xl:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => track(l.event, { location: "navbar", role: "guest" })}
                  className={`text-sm font-medium transition-colors hover:text-secondary ${l.strong ? "" : "text-neutral-content"}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {!loading && user && (
            <>
              {user.role === "company" && (
                <Link to="/dashboard" onClick={() => track("clicked_company_dashboard_nav", { role: "company", location: "navbar" })} className="text-center text-xs font-semibold leading-tight text-secondary hover:underline sm:text-sm">
                  Mis proyectos
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/dashboard" onClick={() => track("clicked_admin_dashboard_nav", { role: "admin", location: "navbar" })} className="text-center text-xs font-semibold leading-tight text-secondary hover:underline sm:text-sm">
                  Panel de administrador
                </Link>
              )}
              <div className="flex min-w-0 flex-col items-center leading-tight" aria-label="Sesión actual">
                <span aria-hidden="true" className="material-symbols-outlined text-xl text-secondary">person</span>
                <span className="text-center text-xs text-neutral-content">
                  Bienvenido · {user.role === "company" ? "Empresa" : user.role === "admin" ? "Administrador" : "Sin rol"}
                </span>
                <span className="max-w-32 truncate text-xs text-white sm:max-w-56" title={user.email}>{user.email}</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="btn btn-sm border-neutral bg-base-300"
                >
                  {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
                {signOutError && (
                  <p role="alert" className="absolute right-0 top-full mt-2 w-64 rounded-box bg-base-300 p-3 text-sm text-error shadow-lg">
                    {signOutError}
                  </p>
                )}
              </div>
            </>
          )}
          {!loading && !user && (
            <>
              {pathname.replace(/\/+$/, "") !== "/iniciar-sesion" && (
                <Link
                  to="/iniciar-sesion"
                  onClick={() => track("clicked_login", { location: "navbar", role: "guest" })}
                  className="btn btn-sm hidden border-neutral bg-base-300 sm:inline-flex"
                >
                  Iniciar sesión
                </Link>
              )}
              <Link
                to="/subir-proyecto"
                onClick={() =>
                  track("clicked_upload_project", { location: "navbar", role: "guest" })
                }
                className="btn btn-sm bg-brand-gradient border-0 text-white shadow-[0_0_20px_rgba(255,0,148,0.35)]"
              >
                Subir Proyecto
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
