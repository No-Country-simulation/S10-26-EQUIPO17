import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { track, type AnalyticsEvent } from "../analytics/analytics";
import { useAuth } from "../../features/auth/useAuth";

const links: { label: string; href: string; event: AnalyticsEvent; strong?: boolean }[] = [
  { label: "Para centros de estudio", href: "https://www.nocountry.tech/simulacion-laboral/como-funciona", event: "clicked_nav_institutions", strong: true },
  { label: "Para Empresas", href: "https://www.nocountry.tech/para-empresas/contratar", event: "clicked_nav_companies", strong: true },
  { label: "Para profesionales emergentes", href: "#talento", event: "clicked_nav_talent", strong: true },
  { label: "Cómo funciona", href: "https://www.nocountry.tech/simulacion-laboral/paradigma", event: "clicked_nav_how_it_works" },
  { label: "Métricas públicas en vivo", href: "https://www.nocountry.tech/", event: "clicked_nav_public_metrics" },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname === "/" && hash === "#talento") {
      document.getElementById("talento")?.scrollIntoView();
    }
  }, [pathname, hash]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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
            <span className="text-gradient text-[11px] font-semibold uppercase tracking-widest xl:hidden 2xl:inline">
              Experiencia de trabajo real
            </span>
          </div>
        </Link>

        {!loading && !user && (
          <ul className="hidden items-center gap-4 xl:flex 2xl:gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href === "#talento" && pathname !== "/" ? "/#talento" : l.href}
                  onClick={() => track(l.event, { location: "navbar", role: "guest" })}
                  className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-secondary ${l.strong ? "" : "text-neutral-content"}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="hidden min-w-0 items-center gap-2 sm:gap-3 xl:flex">
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
        {!loading && (
          <div className="flex items-center gap-2 xl:hidden">
            {!user && (
              <div className="hidden items-center gap-2 sm:flex">
                {pathname.replace(/\/+$/, "") !== "/iniciar-sesion" && (
                  <Link
                    to="/iniciar-sesion"
                    onClick={() => track("clicked_login", { location: "navbar", role: "guest" })}
                    className="btn btn-sm border-neutral bg-base-300"
                  >
                    Iniciar sesión
                  </Link>
                )}
                <Link
                  to="/subir-proyecto"
                  onClick={() => track("clicked_upload_project", { location: "navbar", role: "guest" })}
                  className="btn btn-sm border-0 bg-brand-gradient text-white"
                >
                  Subir Proyecto
                </Link>
              </div>
            )}
            <div ref={menuRef} className={`dropdown dropdown-end ${menuOpen ? "dropdown-open" : ""}`}>
              <button
                ref={menuButtonRef}
                type="button"
                className="btn btn-ghost btn-circle"
                aria-label="Menú de navegación"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span aria-hidden="true" className="material-symbols-outlined">menu</span>
              </button>
              <ul
                id={menuId}
                hidden={!menuOpen}
                style={!menuOpen ? { display: "none" } : undefined}
                className="menu menu-sm dropdown-content z-10 mt-3 max-h-[calc(100vh-6rem)] w-72 max-w-[calc(100vw-1.5rem)] flex-nowrap overflow-y-auto rounded-box border border-neutral bg-base-200 p-2 shadow-xl"
              >
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href === "#talento" && pathname !== "/" ? "/#talento" : link.href}
                      onClick={() => {
                        track(link.event, { location: "navbar", role: user ? user.role ?? "unknown" : "guest" });
                        setMenuOpen(false);
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {!user ? (
                  <>
                    {pathname.replace(/\/+$/, "") !== "/iniciar-sesion" && (
                      <li>
                        <Link to="/iniciar-sesion" onClick={() => {
                          track("clicked_login", { location: "navbar", role: "guest" });
                          setMenuOpen(false);
                        }}>Iniciar sesión</Link>
                      </li>
                    )}
                    <li>
                      <Link to="/subir-proyecto" onClick={() => {
                        track("clicked_upload_project", { location: "navbar", role: "guest" });
                        setMenuOpen(false);
                      }}>Subir Proyecto</Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="menu-title">
                      <span className="break-all">{user.email}</span>
                    </li>
                    {user.role === "company" && (
                      <li><Link to="/dashboard" onClick={() => {
                        track("clicked_company_dashboard_nav", { role: "company", location: "navbar" });
                        setMenuOpen(false);
                      }}>Mis proyectos</Link></li>
                    )}
                    {user.role === "admin" && (
                      <li><Link to="/dashboard" onClick={() => {
                        track("clicked_admin_dashboard_nav", { role: "admin", location: "navbar" });
                        setMenuOpen(false);
                      }}>Panel de administrador</Link></li>
                    )}
                    <li><button type="button" disabled={signingOut} onClick={() => {
                      setMenuOpen(false);
                      void handleSignOut();
                    }}>{signingOut ? "Cerrando sesión..." : "Cerrar sesión"}</button></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
      {signOutError && (
        <p role="alert" className="absolute right-3 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-box bg-base-300 p-3 text-sm text-error shadow-lg">
          {signOutError}
        </p>
      )}
    </header>
  );
}
