import type { EditRequest } from "../editRequestService";
import { EditRequestCard } from "./EditRequestCard";

export type EditRequestsResult =
  | { requests: EditRequest[]; error: null }
  | { requests: null; error: string };

export function EditRequestsList({
  result,
  onRetry,
  onReviewed,
}: {
  result: EditRequestsResult | null;
  onRetry: () => void;
  onReviewed: (id: string, decision: "approve" | "reject") => void;
}) {
  if (!result) {
    return (
      <div role="status" className="flex items-center gap-3 text-neutral-content">
        <span className="loading loading-spinner loading-sm text-primary" />
        Cargando solicitudes de modificación...
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
  if (result.requests.length === 0) {
    return (
      <section className="rounded-box border border-neutral bg-base-200 p-8 text-center shadow-2xl">
        <span className="material-symbols-outlined text-4xl text-secondary">folder_open</span>
        <h2 className="mt-2 text-xl font-bold text-white">No hay solicitudes de modificación</h2>
        <p className="mt-1 text-sm text-neutral-content">Las solicitudes aparecerán aquí cuando estén disponibles.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="edit-requests-heading" className="space-y-4">
      <h2 id="edit-requests-heading" className="text-2xl font-bold text-white">Solicitudes de modificación</h2>
      <div className="grid items-start gap-6 md:grid-cols-2">
        {result.requests.map((request) => <EditRequestCard key={request.id} request={request} onReviewed={onReviewed} />)}
      </div>
    </section>
  );
}
