import {
  labelOf,
  sectorOptions,
  stageOptions,
  verticalOptions,
} from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";

export function ProjectCard({ project, newlyPublished = false }: { project: Project; newlyPublished?: boolean }) {
  return (
    <article className="card border border-neutral bg-base-200 shadow-2xl">
      <div className="card-body gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {newlyPublished && <span className="badge badge-soft badge-success font-bold">Proyecto publicado</span>}
          <span className="badge badge-soft badge-primary badge-sm font-bold">
            Etapa: {labelOf(stageOptions, project.projectStage)}
          </span>
        </div>
        <h3 className="card-title text-2xl font-bold text-white">{project.title}</h3>
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
      </div>
    </article>
  );
}
