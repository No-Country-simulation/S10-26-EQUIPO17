import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiClient";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import type { Project } from "../../project-submission/submissionService";
import { useAuth } from "../../auth/useAuth";
import { ProjectsList } from "../components/ProjectsList";
import { listProjects } from "../projectService";

export function CompanyDashboard() {
  const { user } = useAuth();
  const publishedProject = (useLocation().state as { project?: Project } | null)?.project;
  const [result, setResult] = useState<
    { key: string; projects: Project[]; error: null } | { key: string; projects: null; error: string } | null
  >(null);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState(0);
  const requestKey = `${user?.id ?? ""}:${attempt}`;
  const currentResult = result?.key === requestKey ? result : null;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(0), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const controller = new AbortController();
    listProjects(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, projects: result, error: null });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("No se pudieron cargar los proyectos:", cause);
        setResult({
          key: requestKey,
          projects: null,
          error: cause instanceof ApiError && cause.status === 401
            ? "No se pudo verificar tu sesión. Cierra sesión y vuelve a iniciarla."
            : "No se pudieron cargar tus proyectos. Inténtalo de nuevo.",
        });
      });
    return () => controller.abort();
  }, [requestKey]);

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

          <ProjectsList
            result={currentResult}
            publishedProjectId={publishedProject?.id}
            onRetry={() => setAttempt((value) => value + 1)}
            onEditRequested={() => setNotice((value) => value + 1)}
            canEdit={user?.role === "company"}
          />

          <Link to="/proyecto/nuevo" className="btn border-0 bg-brand-gradient text-white">
            Subir un proyecto
            <span className="material-symbols-outlined text-[20px]">add</span>
          </Link>
        </div>
        {notice > 0 && (
          <div className="toast toast-end toast-bottom z-50">
            <div role="status" className="alert border border-secondary bg-base-300 text-base-content shadow-lg">
              <span>Solicitud de cambio enviada correctamente. El proyecto se actualizará cuando sea aprobada.</span>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Cerrar notificación" onClick={() => setNotice(0)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
