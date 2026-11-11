import type { Project } from "../../project-submission/submissionService";
import { ProjectCard } from "./ProjectCard";

type ProjectsResult = { projects: Project[]; error: null } | { projects: null; error: string };

export function ProjectsList({
  result,
  publishedProjectId,
  onRetry,
}: {
  result: ProjectsResult | null;
  publishedProjectId?: string;
  onRetry: () => void;
}) {
  if (!result) {
    return (
      <div role="status" className="flex items-center gap-3 text-neutral-content">
        <span className="loading loading-spinner loading-sm text-primary" />
        Cargando tus proyectos...
      </div>
    );
  }

  if (result.error !== null) {
    return (
      <div role="alert" className="alert alert-error alert-soft">
        <span className="material-symbols-outlined">error</span>
        <span>{result.error}</span>
        <button type="button" className="btn btn-sm" onClick={onRetry}>Reintentar</button>
      </div>
    );
  }

  if (result.projects.length === 0) {
    return (
      <section className="rounded-box border border-neutral bg-base-200 p-8 text-center shadow-2xl">
        <span className="material-symbols-outlined text-4xl text-secondary">folder_open</span>
        <h2 className="mt-2 text-xl font-bold text-white">Aún no hay proyectos para mostrar</h2>
        <p className="mt-1 text-sm text-neutral-content">Cuando publiques un proyecto, aparecerá aquí.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="projects-heading" className="space-y-4">
      <h2 id="projects-heading" className="text-2xl font-bold text-white">Tus proyectos</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {result.projects.map((project) => (
          <ProjectCard key={project.id} project={project} newlyPublished={project.id === publishedProjectId} />
        ))}
      </div>
    </section>
  );
}
