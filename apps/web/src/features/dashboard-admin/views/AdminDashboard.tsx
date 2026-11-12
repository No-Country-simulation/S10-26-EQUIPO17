import { useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/apiClient";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import { useAuth } from "../../auth/useAuth";
import { EditRequestsList, type EditRequestsResult } from "../components/EditRequestsList";
import { listEditRequests } from "../editRequestService";

export function AdminDashboard() {
  const { user } = useAuth();
  const [result, setResult] = useState<{ key: string; value: EditRequestsResult } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${user?.id ?? ""}:${attempt}`;
  const currentResult = result?.key === requestKey ? result.value : null;

  useEffect(() => {
    const controller = new AbortController();
    listEditRequests(controller.signal)
      .then((requests) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, value: { requests, error: null } });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("No se pudieron cargar las solicitudes de modificación:", cause);
        setResult({
          key: requestKey,
          value: {
            requests: null,
            error: cause instanceof ApiError && cause.status === 401
              ? "No se pudo verificar tu sesión. Cierra sesión y vuelve a iniciarla."
              : "No se pudieron cargar las solicitudes de modificación. Inténtalo de nuevo.",
          },
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
              Panel de <span className="text-gradient">administrador</span>
            </h1>
            <p className="text-neutral-content">Sesión iniciada como {user?.email}</p>
          </header>
          <EditRequestsList result={currentResult} onRetry={() => setAttempt((value) => value + 1)} />
        </div>
      </div>
    </PublicLayout>
  );
}
