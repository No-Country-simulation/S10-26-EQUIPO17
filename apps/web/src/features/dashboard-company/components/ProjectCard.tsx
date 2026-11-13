import { useId, useRef } from "react";
import { track } from "../../../shared/analytics/analytics";
import { stageOptions } from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";
import { OptionBadge } from "./OptionBadge";
import { ProjectDetailsModal } from "./ProjectDetailsModal";

export function ProjectCard({
  project,
  newlyPublished = false,
  canEdit = false,
  onEditRequested,
}: {
  project: Project;
  newlyPublished?: boolean;
  canEdit?: boolean;
  onEditRequested?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalId = useId();

  return (
    <>
      <div
        className="hover-3d w-full motion-reduce:*:transform-none! motion-reduce:*:scale-100!"
        onClick={(event) => {
          if (
            event.target instanceof HTMLDivElement &&
            event.target.parentElement === event.currentTarget
          ) {
            triggerRef.current?.click();
          }
        }}
      >
        <article className="card border border-neutral bg-base-200 shadow-2xl">
          <button
            ref={triggerRef}
            type="button"
            className="card-body w-full gap-4 rounded-box p-6 text-left transition-colors hover:bg-base-300 focus-visible:outline-2 focus-visible:outline-secondary md:p-8"
            aria-haspopup="dialog"
            popoverTarget={modalId}
            onClick={() =>
              track("opened_company_project", {
                role: canEdit ? "company" : "unknown",
              })
            }
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-warning">
                <span
                  aria-hidden="true"
                  className="status status-warning motion-safe:animate-pulse"
                />
                Pending
              </span>
              {newlyPublished && (
                <span className="badge badge-soft badge-success font-bold">
                  Proyecto publicado
                </span>
              )}
            </span>
            <span className="card-title text-2xl font-bold  text-gradient">
              {project.title}
            </span>
            <span className="whitespace-pre-line text-sm text-neutral-content">
              {project.description}
            </span>
            <span className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-neutral-content">
                Etapa actual del proyecto
              </span>
              <span>
                <OptionBadge
                  options={stageOptions}
                  value={project.projectStage}
                />
              </span>
            </span>
          </button>
        </article>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} aria-hidden="true" />
        ))}
      </div>

      <ProjectDetailsModal project={project} canEdit={canEdit} modalId={modalId} triggerRef={triggerRef} onEditRequested={onEditRequested} />
    </>
  );
}
