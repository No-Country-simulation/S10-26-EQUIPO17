import { Link } from "react-router-dom";
import { track, type AnalyticsEvent } from "../analytics/analytics";

const links: { label: string; href: string; event: AnalyticsEvent; strong?: boolean }[] = [
  { label: "Para centros de estudio", href: "#instituciones", event: "clicked_nav_institutions", strong: true },
  { label: "Para Empresas", href: "#empresas", event: "clicked_nav_companies", strong: true },
  { label: "Para profesionales emergentes", href: "#talento", event: "clicked_nav_talent", strong: true },
  { label: "Cómo funciona", href: "#simulacion", event: "clicked_nav_how_it_works" },
  { label: "Métricas públicas en vivo", href: "#public-dashboard", event: "clicked_nav_public_metrics" },
];

export function Navbar() {
  return (
    <header className="navbar fixed inset-x-0 top-0 z-50 h-20 border-b border-neutral bg-base-200/90 px-6 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-neutral bg-base-300 text-secondary">
            <span className="material-symbols-outlined">terminal</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-white">No Country</span>
            <span className="text-gradient text-[11px] font-semibold uppercase tracking-widest">
              Experiencia de trabajo real
            </span>
          </div>
        </Link>

        <ul className="hidden items-center gap-8 xl:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => track(l.event, { location: "navbar" })}
                className={`text-sm font-medium transition-colors hover:text-secondary ${l.strong ? "" : "text-neutral-content"}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to="/cargar-desafio"
            onClick={() => track("clicked_login", { location: "navbar" })}
            className="btn btn-sm hidden border-neutral bg-base-300 sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/subir-proyecto"
            onClick={() =>
              track("clicked_upload_project", { location: "navbar" })
            }
            className="btn btn-sm bg-brand-gradient border-0 text-white shadow-[0_0_20px_rgba(255,0,148,0.35)]"
          >
            Subir Proyecto
          </Link>
        </div>
      </div>
    </header>
  );
}
