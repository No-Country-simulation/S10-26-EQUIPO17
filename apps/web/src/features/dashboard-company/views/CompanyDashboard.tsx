import { Link, useLocation } from "react-router-dom";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import {
  labelOf,
  sectorOptions,
  stageOptions,
  verticalOptions,
} from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";
import { useAuth } from "../../auth/useAuth";

// Mientras no exista GET /projects, el único proyecto disponible es el que devolvió el 201 al publicar.
export function CompanyDashboard() {
  const { user } = useAuth();
  const project = (useLocation().state as { project?: Project } | null)?.project;

  return (
    <PublicLayout>
      <div className="relative overflow-hidden px-6 py-10 lg:px-8">
        <div className="pointer-events-none absolute -top-40 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white lg:text-4xl">
              Tu <span className="text-gradient">panel</span>
            </h1>
            <p className="text-neutral-content">Sesión iniciada como {user?.email}</p>
          </header>

          {project ? (
            <section className="space-y-4 rounded-box border border-neutral bg-base-200 p-6 shadow-2xl md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-soft badge-success font-bold">Proyecto publicado</span>
                <span className="badge badge-soft badge-primary badge-sm font-bold">
                  Etapa: {labelOf(stageOptions, project.projectStage)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{project.title}</h2>
              <p className="whitespace-pre-line text-sm text-neutral-content">{project.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="badge badge-soft badge-secondary badge-sm">
                  {labelOf(verticalOptions, project.vertical)}
                </span>
                {project.businessSectors.map((sector) => (
                  <span key={sector} className="badge badge-soft badge-accent badge-sm">
                    {labelOf(sectorOptions, sector)}
                  </span>
                ))}
              </div>
              <p className="text-xs text-neutral-content">ID: {project.id}</p>
            </section>
          ) : (
            <section className="rounded-box border border-neutral bg-base-200 p-8 text-center shadow-2xl">
              <span className="material-symbols-outlined text-4xl text-secondary">folder_open</span>
              <h2 className="mt-2 text-xl font-bold text-white">Aún no hay proyectos para mostrar</h2>
              <p className="mt-1 text-sm text-neutral-content">
                El listado de tus proyectos estará disponible cuando la API lo exponga.
              </p>
            </section>
          )}

          <Link to="/proyecto/nuevo" className="btn border-0 bg-brand-gradient text-white">
            Subir un proyecto
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
