import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../shared/api/apiClient";
import { track } from "../../shared/analytics/analytics";
import type { Project } from "../project-submission/submissionService";
import { hasProjectChanges, projectEditSchema, projectEditValues, type ProjectEditValues } from "./projectEditSchema";
import { submitProjectEditRequest } from "./projectService";

export function useProjectEdit(project: Project, modalId: string, onEditRequested?: () => void) {
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
      return;
    }
    track("company_project_edit_submitted", { role: "company" });
    submittingRef.current = false;
    setSubmitting(false);
    document.getElementById(modalId)?.hidePopover();
    resetEditor();
    onEditRequested?.();
  }

  return { isEditing, setIsEditing, values, setValues, error, setError, submitting, submittingRef, validation, hasChanges, fieldError, resetEditor, handleSubmit };
}
