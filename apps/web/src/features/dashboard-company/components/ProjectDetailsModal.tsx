import { useId, type RefObject } from "react";
import { track } from "../../../shared/analytics/analytics";
import { sectorOptions, stageOptions, verticalOptions } from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";
import { projectEditValues } from "../projectEditSchema";
import { useProjectEdit } from "../useProjectEdit";
import { OptionBadge } from "./OptionBadge";
import { ProjectEditForm } from "./ProjectEditForm";

export function ProjectDetailsModal({ project, canEdit, modalId, triggerRef, onEditRequested }: {
  project: Project;
  canEdit: boolean;
  modalId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onEditRequested?: () => void;
}) {
  const titleId = useId();
  const editor = useProjectEdit(project, modalId, onEditRequested);
  const { isEditing, setIsEditing, setValues, setError, submitting, submittingRef, resetEditor } = editor;

  return (
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
        } else if (submittingRef.current) {
          event.currentTarget.showPopover();
        } else {
          resetEditor();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (submittingRef.current) return;
          event.currentTarget.hidePopover();
          triggerRef.current?.focus();
        } else if (event.key === "Tab") {
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              ".modal-box button:not(:disabled), .modal-box input:not(:disabled), .modal-box textarea:not(:disabled), .modal-box select:not(:disabled)",
            ),
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (
            first &&
            last &&
            (event.shiftKey
              ? document.activeElement === first
              : document.activeElement === last)
          ) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
        }
      }}
    >
      <div className="modal-box border border-neutral bg-base-200">
        <h2 id={titleId} className="text-2xl font-bold text-gradient">
          {project.title}
        </h2>
        {!isEditing ? (
          <>
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
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    track("started_company_project_edit", {
                      role: "company",
                    });
                    setValues(projectEditValues(project));
                    setError(null);
                    setIsEditing(true);
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-base"
                  >
                    edit
                  </span>
                  Editar proyecto
                </button>
              )}
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
          </>
        ) : (
          <ProjectEditForm editor={editor} />
        )}
      </div>
      <div className="modal-backdrop">
        <button
          type="button"
          popoverTarget={modalId}
          popoverTargetAction="hide"
          aria-label="Cerrar detalle del proyecto"
          disabled={submitting}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
