import type { ReactNode } from "react";
import { labelOf, sectorOptions, stageOptions, verticalOptions, type SelectOption } from "../../project-submission/challengeFormOptions";
import type { EditRequest } from "../editRequestService";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-sm font-semibold text-neutral-content">{label}</dt>
      <dd className="break-words whitespace-pre-line text-sm text-base-content">{children}</dd>
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

export function EditRequestCard({ request }: { request: EditRequest }) {
  const project = request.proposedProject;

  return (
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
        <h3 className="card-title break-words text-2xl font-bold text-gradient">{project.title}</h3>
        <dl className="space-y-4">
          <Detail label="Identificador de la solicitud">{request.id}</Detail>
          <Detail label="Identificador del proyecto">{request.projectId}</Detail>
          <Detail label="Identificador de la empresa">{request.companyId}</Detail>
          <Detail label="Solicitado por (identificador de usuario)">{request.requestedByUserId}</Detail>
          <Detail label="Fecha de creación">{request.createdAt}</Detail>
          <Detail label="Revisado por (identificador de usuario)">{request.reviewedByUserId ?? "Sin revisar"}</Detail>
          <Detail label="Fecha de revisión">{request.reviewedAt ?? "Sin revisar"}</Detail>
          <Detail label="Motivo de rechazo">{request.rejectionReason ?? "Sin motivo de rechazo"}</Detail>
        </dl>
        <div className="divider my-0" />
        <h4 className="text-lg font-bold text-white">Proyecto propuesto</h4>
        <dl className="space-y-4">
          <Detail label="Identificador del proyecto propuesto">{project.id}</Detail>
          <Detail label="Identificador de la empresa del proyecto">{project.companyId}</Detail>
          <Detail label="Título">{project.title}</Detail>
          <Detail label="Descripción">{project.description}</Detail>
          <Detail label="Vertical de la solución"><OptionBadge options={verticalOptions} value={project.vertical} /></Detail>
          <Detail label="Sectores involucrados">
            {project.businessSectors.length > 0
              ? <span className="flex flex-wrap gap-2">{project.businessSectors.map((sector, index) => (
                  <OptionBadge key={`${sector}-${index}`} options={sectorOptions} value={sector} />
                ))}</span>
              : "Sin sectores"}
          </Detail>
          <Detail label="Etapa actual del proyecto"><OptionBadge options={stageOptions} value={project.projectStage} /></Detail>
        </dl>
      </div>
    </article>
  );
}
