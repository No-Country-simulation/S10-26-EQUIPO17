import { useId, useRef } from "react";
import {
  labelOf,
  sectorOptions,
  stageOptions,
  verticalOptions,
  type SelectOption,
} from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";

function OptionBadge({
  options,
  value,
}: {
  options: SelectOption[];
  value: string;
}) {
  const icon = options.find((option) => option.value === value)?.icon;

  return (
    <span className="aura aura-holo ">
      <span className="badge badge-soft badge-primary h-auto gap-2 rounded-xl bg-base-200 py-2 px-1.5">
        {icon && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-base"
          >
            {icon}
          </span>
        )}
        {labelOf(options, value)}
      </span>
    </span>
  );
}

export function ProjectCard({
  project,
  newlyPublished = false,
}: {
  project: Project;
  newlyPublished?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const modalId = useId();

  return (
    <>
      <div
        className="hover-3d w-full motion-reduce:[&>*]:!transform-none motion-reduce:[&>*]:!scale-100"
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
            className="card-body w-full gap-4 rounded-box p-6 text-left transition-colors hover:bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary md:p-8"
            aria-haspopup="dialog"
            popoverTarget={modalId}
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

      <div
        id={modalId}
        className="modal"
        popover="auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onToggle={(event) => {
          if (event.currentTarget.matches(":popover-open")) {
            event.currentTarget
              .querySelector<HTMLButtonElement>(".modal-action button")
              ?.focus();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.hidePopover();
            triggerRef.current?.focus();
          } else if (event.key === "Tab") {
            event.preventDefault();
            event.currentTarget
              .querySelector<HTMLButtonElement>(".modal-action button")
              ?.focus();
          }
        }}
      >
        <div className="modal-box border border-neutral bg-base-200">
          <h2 id={titleId} className="text-2xl font-bold text-gradient">
            {project.title}
          </h2>
          <dl className="mt-6 space-y-6">
            <div>
              <dt className="mb-2 text-sm font-semibold text-neutral-content">
                Descripción del problema a resolver
              </dt>
              <dd className="whitespace-pre-line text-base-content">
                {project.description}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-sm font-semibold text-neutral-content">
                Etapa actual del proyecto
              </dt>
              <dd>
                <OptionBadge
                  options={stageOptions}
                  value={project.projectStage}
                />
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-sm font-semibold text-neutral-content">
                Vertical de la solución
              </dt>
              <dd>
                <OptionBadge
                  options={verticalOptions}
                  value={project.vertical}
                />
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-sm font-semibold text-neutral-content">
                Sectores involucrados
              </dt>
              <dd className="flex flex-wrap gap-2">
                {project.businessSectors.map((sector) => (
                  <OptionBadge
                    key={sector}
                    options={sectorOptions}
                    value={sector}
                  />
                ))}
              </dd>
            </div>
          </dl>
          <div className="modal-action">
            <button
              type="button"
              autoFocus
              popoverTarget={modalId}
              popoverTargetAction="hide"
              className="btn border-neutral bg-base-300"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="modal-backdrop">
          <button
            type="button"
            popoverTarget={modalId}
            popoverTargetAction="hide"
            aria-label="Cerrar detalle del proyecto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
