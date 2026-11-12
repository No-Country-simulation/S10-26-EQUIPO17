import { useId, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../../shared/api/apiClient";
import { track } from "../../../shared/analytics/analytics";
import {
  labelOf,
  sectorOptions,
  stageOptions,
  verticalOptions,
  type SelectOption,
} from "../../project-submission/challengeFormOptions";
import type { Project } from "../../project-submission/submissionService";
import { hasProjectChanges, projectEditSchema, projectEditValues, type ProjectEditValues } from "../projectEditSchema";
import { submitProjectEditRequest } from "../projectService";

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
  canEdit = false,
  onEditRequested,
}: {
  project: Project;
  newlyPublished?: boolean;
  canEdit?: boolean;
  onEditRequested?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const modalId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<ProjectEditValues>(() => projectEditValues(project));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const validation = projectEditSchema.safeParse(values);
  const hasChanges = hasProjectChanges(values, project);
  const fieldError = (name: keyof ProjectEditValues) =>
    validation.success ? undefined : validation.error.issues.find((issue) => issue.path[0] === name)?.message;

  function resetEditor() {
    setValues(projectEditValues(project));
    setError(null);
    setIsEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = projectEditSchema.safeParse(values);
    if (submittingRef.current || !parsed.success || !hasProjectChanges(parsed.data, project)) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await submitProjectEditRequest(project.id, parsed.data);
    } catch (cause: unknown) {
      console.error("No se pudo enviar la solicitud de cambio:", cause);
      track("company_project_edit_failed", {
        role: "company",
        status: cause instanceof ApiError ? String(cause.status) : "network",
      });
      setError(cause instanceof ApiError && cause.status === 401
        ? "No se pudo verificar tu sesión. Cierra sesión y vuelve a iniciarla."
        : cause instanceof ApiError && cause.status === 403
          ? "No tienes permiso para solicitar cambios en este proyecto."
          : cause instanceof ApiError && cause.status === 409
            ? "Ya existe una solicitud de cambio pendiente para este proyecto."
            : cause instanceof ApiError && cause.status === 400
              ? "Los datos no son válidos o el proyecto ya no admite estos cambios. Revísalos e inténtalo de nuevo."
              : "No se pudo enviar la solicitud. Inténtalo de nuevo.");
      submittingRef.current = false;
      setSubmitting(false);
      track("company_project_edit_submitted", { role: "company" });
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    document.getElementById(modalId)?.hidePopover();
    resetEditor();
    onEditRequested?.();
  }

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
            onClick={() => track("opened_company_project", { role: canEdit ? "company" : "unknown" })}
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
            const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
              ".modal-box button:not(:disabled), .modal-box input:not(:disabled), .modal-box textarea:not(:disabled), .modal-box select:not(:disabled)",
            ));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
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
          {!isEditing ? <>
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
              <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                track("started_company_project_edit", { role: "company" });
                setValues(projectEditValues(project));
                setError(null);
                setIsEditing(true);
              }}>
                <span aria-hidden="true" className="material-symbols-outlined text-base">edit</span>
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
          </> : (
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
              <fieldset disabled={submitting} className="space-y-4">
                <label className="form-control block space-y-2">
                  <span className="text-sm font-semibold text-neutral-content">Título del proyecto</span>
                  <input autoFocus className="input w-full" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} aria-invalid={Boolean(fieldError("title"))} />
                  {fieldError("title") && <span className="block text-xs text-[#f87171]">{fieldError("title")}</span>}
                </label>
                <label className="form-control block space-y-2">
                  <span className="text-sm font-semibold text-neutral-content">Descripción del problema a resolver</span>
                  <textarea className="textarea w-full" rows={4} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} aria-invalid={Boolean(fieldError("description"))} />
                  {fieldError("description") && <span className="block text-xs text-[#f87171]">{fieldError("description")}</span>}
                </label>
                <label className="form-control block space-y-2">
                  <span className="text-sm font-semibold text-neutral-content">Vertical de la solución</span>
                  <select className="select w-full" value={values.vertical} onChange={(event) => setValues({ ...values, vertical: event.target.value })} aria-invalid={Boolean(fieldError("vertical"))}>
                    {!verticalOptions.some((option) => option.value === values.vertical) && <option value={values.vertical}>Selecciona una vertical</option>}
                    {verticalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {fieldError("vertical") && <span className="block text-xs text-[#f87171]">{fieldError("vertical")}</span>}
                </label>
                <label className="form-control block space-y-2">
                  <span className="text-sm font-semibold text-neutral-content">Etapa actual del proyecto</span>
                  <select className="select w-full" value={values.projectStage} onChange={(event) => setValues({ ...values, projectStage: event.target.value })} aria-invalid={Boolean(fieldError("projectStage"))}>
                    {!stageOptions.some((option) => option.value === values.projectStage) && <option value={values.projectStage}>Selecciona una etapa</option>}
                    {stageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {fieldError("projectStage") && <span className="block text-xs text-[#f87171]">{fieldError("projectStage")}</span>}
                </label>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-neutral-content">Sectores involucrados</legend>
                  {sectorOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-base-content">
                      <input type="checkbox" className="checkbox checkbox-sm" checked={values.businessSectors.includes(option.value)} onChange={(event) => setValues({
                        ...values,
                        businessSectors: event.target.checked
                          ? [...values.businessSectors, option.value]
                          : values.businessSectors.filter((sector) => sector !== option.value),
                      })} />
                      {option.icon && <span aria-hidden="true" className="material-symbols-outlined text-base">{option.icon}</span>}
                      {option.label}
                    </label>
                  ))}
                  {values.businessSectors.filter((sector) => !sectorOptions.some((option) => option.value === sector)).map((sector, index) => (
                    <label key={`${sector}-${index}`} className="flex items-center gap-2 text-sm text-base-content">
                      <input type="checkbox" className="checkbox checkbox-sm" checked onChange={() => setValues({
                        ...values,
                        businessSectors: values.businessSectors.filter((value) => value !== sector),
                      })} />
                      {sector} (no disponible)
                    </label>
                  ))}
                  {fieldError("businessSectors") && <p className="text-xs text-[#f87171]">{fieldError("businessSectors")}</p>}
                </fieldset>
              </fieldset>
              {error && <p role="alert" className="text-sm text-[#f87171]">{error}</p>}
              <div className="modal-action">
                <button type="button" className="btn border-neutral bg-base-300" disabled={submitting} onClick={() => {
                  track("cancelled_company_project_edit", { role: "company" });
                  resetEditor();
                }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={!hasChanges || !validation.success || submitting}>
                  {submitting && <span className="loading loading-spinner loading-sm" />}
                  Solicitar cambio
                </button>
              </div>
              {!hasChanges && <p className="text-right text-xs text-base-content/60">Modifica al menos un campo para habilitar el envío.</p>}
            </form>
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
    </>
  );
}
