import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../../shared/api/apiClient";
import { track } from "../../../shared/analytics/analytics";
import { labelOf, sectorOptions, stageOptions, verticalOptions, type SelectOption } from "../../project-submission/challengeFormOptions";
import { approveEditRequest, rejectEditRequest, type EditRequest } from "../editRequestService";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-sm font-semibold text-neutral-content">
        {label}
      </dt>
      <dd className="wrap-break-word whitespace-pre-line text-sm text-base-content">
        {children}
      </dd>
    </div>
  );
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function FormattedDate({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <>Fecha inválida: {value}</>;
  return <time dateTime={value}>{dateFormatter.format(date)} UTC</time>;
}

function Identifier({ label, value }: { label: string; value: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  async function copyIdentifier() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Portapapeles no disponible");
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      timerRef.current = setTimeout(() => setCopyState("idle"), 2000);
    } catch (cause: unknown) {
      console.error("No se pudo copiar el identificador:", cause);
      setCopyState("error");
    }
  }

  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-neutral-content">{label}</div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm" title={value}>{value}</span>
        <div className="tooltip tooltip-left" data-tip={copyState === "copied" ? "¡Copiado!" : "Copiar"}>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm"
            aria-label={`Copiar ${label.toLowerCase()}`}
            onClick={() => void copyIdentifier()}
          >
            <span className={`swap swap-rotate ${copyState === "copied" ? "swap-active" : ""}`} aria-hidden="true">
              <span className="swap-off material-symbols-outlined">content_copy</span>
              <span className="swap-on material-symbols-outlined">check</span>
            </span>
          </button>
        </div>
      </div>
      <p className="text-sm" role="status" aria-live="polite">
        {copyState === "copied" ? "¡Copiado!" : copyState === "error" ? "No se pudo copiar. Inténtalo de nuevo." : ""}
      </p>
    </div>
  );
}

function OptionBadge({ options, value }: { options: SelectOption[]; value: string }) {
  const label = labelOf(options, value);
  const icon = options.find((option) => option.value === value)?.icon;
  return (
    <span className="badge badge-soft badge-primary h-auto gap-2 rounded-xl bg-base-200 px-2 py-2">
      {icon && <span aria-hidden="true" className="material-symbols-outlined text-base">{icon}</span>}
      {label === value ? value : `${label} (${value})`}
    </span>
  );
}

export function EditRequestCard({
  request,
  onReviewed,
}: {
  request: EditRequest;
  onReviewed: (id: string, decision: "approve" | "reject") => void;
}) {
  const project = request.proposedProject;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const headingId = useId();
  const reasonId = useId();
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openDialog(nextDecision: "approve" | "reject") {
    track("opened_admin_edit_review", { role: "admin", decision: nextDecision });
    setDecision(nextDecision);
    setReason("");
    setError(null);
    dialogRef.current?.showModal();
  }

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const trimmedReason = reason.trim();
    if (decision === "reject" && !trimmedReason) {
      setError("Ingresa la razón del rechazo.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      if (decision === "approve") await approveEditRequest(request.id);
      else await rejectEditRequest(request.id, trimmedReason);
    } catch (cause: unknown) {
      console.error("No se pudo revisar la solicitud:", cause);
      track("admin_edit_review_failed", {
        role: "admin",
        decision,
        status: cause instanceof ApiError ? String(cause.status) : "network",
      });
      setError(cause instanceof ApiError && cause.status === 401
        ? "No se pudo verificar tu sesión. Cierra sesión y vuelve a iniciarla."
        : cause instanceof ApiError && cause.status === 409
          ? "La solicitud ya fue revisada o cambió. Actualiza la página para consultar su estado."
          : "No se pudo actualizar la solicitud. Inténtalo de nuevo.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }
    track("admin_edit_review_succeeded", { role: "admin", decision });
    dialogRef.current?.close();
    onReviewed(request.id, decision);
  }

  return (
    <>
    <article className="card h-full rounded-box border border-neutral bg-base-200 shadow-2xl">
      <div className="card-body gap-5 p-6 md:p-8">
        <div>
          <span className="text-sm font-semibold text-neutral-content">Estado: </span>
          {request.status === "pending" ? (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-warning">
              <span aria-hidden="true" className="status status-warning motion-safe:animate-pulse" />
              Pendiente (pending)
            </span>
          ) : (
            <span className="badge badge-soft badge-neutral">{request.status}</span>
          )}
        </div>
        <h3 className="card-title wrap-break-word text-2xl font-bold text-gradient">{project.title}</h3>
        <details className="collapse collapse-arrow border border-neutral bg-base-300">
          <summary className="collapse-title font-semibold">Detalles técnicos e IDs</summary>
          <div className="collapse-content grid grid-cols-1 gap-4 md:grid-cols-2">
            <Identifier label="Identificador de Solicitud" value={request.id} />
            <Identifier label="Identificador del proyecto" value={request.projectId} />
            <Identifier label="Identificador de la empresa" value={request.companyId} />
            <Identifier label="Solicitado por (identificador de usuario)" value={request.requestedByUserId} />
            {project.id !== request.projectId && <Identifier label="Identificador del proyecto propuesto" value={project.id} />}
            {project.companyId !== request.companyId && <Identifier label="Identificador de la empresa del proyecto" value={project.companyId} />}
          </div>
        </details>
        <dl className="space-y-4">
          <Detail label="Descripción">{project.description}</Detail>
        </dl>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Fecha de creación"><FormattedDate value={request.createdAt} /></Detail>
          <Detail label="Vertical de la solución"><OptionBadge options={verticalOptions} value={project.vertical} /></Detail>
          <Detail label="Etapa actual del proyecto"><OptionBadge options={stageOptions} value={project.projectStage} /></Detail>
          <Detail label="Sectores involucrados">
            {project.businessSectors.length > 0
              ? <span className="flex flex-wrap gap-2">{project.businessSectors.map((sector, index) => (
                  <OptionBadge key={`${sector}-${index}`} options={sectorOptions} value={sector} />
                ))}</span>
              : "Sin sectores"}
          </Detail>
          {request.reviewedByUserId !== null && <Detail label="Revisado por (identificador de usuario)">{request.reviewedByUserId}</Detail>}
          {request.reviewedAt !== null && <Detail label="Fecha de revisión"><FormattedDate value={request.reviewedAt} /></Detail>}
          {request.rejectionReason !== null && <Detail label="Motivo de rechazo">{request.rejectionReason}</Detail>}
        </dl>
        {request.status === "pending" && (
          <div className="card-actions mt-2 flex-wrap">
            <button type="button" className="btn border-0 bg-brand-gradient text-white" onClick={() => openDialog("approve")}>
              Aceptar
            </button>
            <button type="button" className="btn border-neutral bg-base-300" onClick={() => openDialog("reject")}>
              Rechazar
            </button>
          </div>
        )}
      </div>
    </article>
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={headingId}
      onCancel={(event) => {
        if (submittingRef.current) event.preventDefault();
      }}
    >
      <div className="modal-box border border-neutral bg-base-200">
        <h3 id={headingId} className="text-xl font-bold text-white">
          {decision === "approve" ? "¿Quieres aceptar este cambio en el proyecto?" : "¿Quieres rechazar el cambio del proyecto?"}
        </h3>
        <form onSubmit={(event) => void handleReview(event)}>
          {decision === "reject" && (
            <fieldset className="fieldset mt-4">
              <legend className="fieldset-legend text-sm font-semibold text-white">Razón</legend>
              <textarea
                id={reasonId}
                aria-label="Razón"
                className="textarea w-full"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                disabled={submitting}
              />
            </fieldset>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-[#f87171]">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn border-neutral bg-base-300" disabled={submitting} onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="btn border-0 bg-brand-gradient text-white" disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-sm" />}
              {decision === "approve" ? "Aceptar" : "Rechazar"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
    </>
  );
}
