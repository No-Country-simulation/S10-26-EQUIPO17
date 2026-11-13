import { sectorOptions, stageOptions, verticalOptions } from "../../project-submission/challengeFormOptions";
import { track } from "../../../shared/analytics/analytics";
import type { useProjectEdit } from "../useProjectEdit";

export function ProjectEditForm({ editor }: { editor: ReturnType<typeof useProjectEdit> }) {
  const { values, setValues, fieldError, submitting, error, hasChanges, validation, handleSubmit, resetEditor } = editor;

  return (
    <form
    className="mt-6 space-y-4"
    onSubmit={(event) => void handleSubmit(event)}
    noValidate
  >
    <fieldset disabled={submitting} className="space-y-4">
      <label className="form-control block space-y-2">
        <span className="text-sm font-semibold text-neutral-content">
          Título del proyecto
        </span>
        <input
          autoFocus
          className="input w-full"
          value={values.title}
          onChange={(event) =>
            setValues({ ...values, title: event.target.value })
          }
          aria-invalid={Boolean(fieldError("title"))}
        />
        {fieldError("title") && (
          <span className="block text-xs text-[#f87171]">
            {fieldError("title")}
          </span>
        )}
      </label>
      <label className="form-control block space-y-2">
        <span className="text-sm font-semibold text-neutral-content">
          Descripción del problema a resolver
        </span>
        <textarea
          className="textarea w-full"
          rows={4}
          value={values.description}
          onChange={(event) =>
            setValues({ ...values, description: event.target.value })
          }
          aria-invalid={Boolean(fieldError("description"))}
        />
        {fieldError("description") && (
          <span className="block text-xs text-[#f87171]">
            {fieldError("description")}
          </span>
        )}
      </label>
      <label className="form-control block space-y-2">
        <span className="text-sm font-semibold text-neutral-content">
          Vertical de la solución
        </span>
        <select
          className="select w-full"
          value={values.vertical}
          onChange={(event) =>
            setValues({ ...values, vertical: event.target.value })
          }
          aria-invalid={Boolean(fieldError("vertical"))}
        >
          {!verticalOptions.some(
            (option) => option.value === values.vertical,
          ) && (
            <option value={values.vertical}>
              Selecciona una vertical
            </option>
          )}
          {verticalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError("vertical") && (
          <span className="block text-xs text-[#f87171]">
            {fieldError("vertical")}
          </span>
        )}
      </label>
      <label className="form-control block space-y-2">
        <span className="text-sm font-semibold text-neutral-content">
          Etapa actual del proyecto
        </span>
        <select
          className="select w-full"
          value={values.projectStage}
          onChange={(event) =>
            setValues({ ...values, projectStage: event.target.value })
          }
          aria-invalid={Boolean(fieldError("projectStage"))}
        >
          {!stageOptions.some(
            (option) => option.value === values.projectStage,
          ) && (
            <option value={values.projectStage}>
              Selecciona una etapa
            </option>
          )}
          {stageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError("projectStage") && (
          <span className="block text-xs text-[#f87171]">
            {fieldError("projectStage")}
          </span>
        )}
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-neutral-content">
          Sectores involucrados
        </legend>
        {sectorOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-base-content"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={values.businessSectors.includes(option.value)}
              onChange={(event) =>
                setValues({
                  ...values,
                  businessSectors: event.target.checked
                    ? [...values.businessSectors, option.value]
                    : values.businessSectors.filter(
                        (sector) => sector !== option.value,
                      ),
                })
              }
            />
            {option.icon && (
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-base"
              >
                {option.icon}
              </span>
            )}
            {option.label}
          </label>
        ))}
        {values.businessSectors
          .filter(
            (sector) =>
              !sectorOptions.some(
                (option) => option.value === sector,
              ),
          )
          .map((sector, index) => (
            <label
              key={`${sector}-${index}`}
              className="flex items-center gap-2 text-sm text-base-content"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked
                onChange={() =>
                  setValues({
                    ...values,
                    businessSectors: values.businessSectors.filter(
                      (value) => value !== sector,
                    ),
                  })
                }
              />
              {sector} (no disponible)
            </label>
          ))}
        {fieldError("businessSectors") && (
          <p className="text-xs text-[#f87171]">
            {fieldError("businessSectors")}
          </p>
        )}
      </fieldset>
    </fieldset>
    {error && (
      <p role="alert" className="text-sm text-[#f87171]">
        {error}
      </p>
    )}
    <div className="modal-action">
      <button
        type="button"
        className="btn border-neutral bg-base-300"
        disabled={submitting}
        onClick={() => {
          track("cancelled_company_project_edit", {
            role: "company",
          });
          resetEditor();
        }}
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!hasChanges || !validation.success || submitting}
      >
        {submitting && (
          <span className="loading loading-spinner loading-sm" />
        )}
        Solicitar cambio
      </button>
    </div>
    {!hasChanges && (
      <p className="text-right text-xs text-base-content/60">
        Modifica al menos un campo para habilitar el envío.
      </p>
    )}
  </form>
  );
}
