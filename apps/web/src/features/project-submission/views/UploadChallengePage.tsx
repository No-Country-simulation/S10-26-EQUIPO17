import { Link } from "react-router-dom";
import { PublicLayout } from "../../../shared/layouts/PublicLayout";
import {
  Badge,
  BenefitItem,
  StepNumber,
} from "../components/UploadChallengeComponents";

const steps = [
  {
    title: "Sube tu proyecto",
    description:
      "Describe la necesidad de tu negocio, brinda contexto sobre el desafío y explica el impacto esperado.",
  },
  {
    title: "Los equipos aceptan el desafío",
    description:
      "Varios equipos reciben el desafío durante la simulación y comienzan a trabajar en soluciones.",
  },
  {
    title: "Revisa las soluciones",
    description:
      "Sigue el progreso y revisa las soluciones que entregan los distintos equipos.",
  },
  {
    title: "Decide los próximos pasos",
    description:
      "Continúa observando, accede a datos clave o amplía la experiencia a una opción prémium.",
  },
];

const benefits = [
  { text: "Acceso a datos públicos de todos los equipos", checked: true },
  { text: "Consulta perfiles y actividad en tiempo real", checked: true },
  { text: "Revisa los entregables finales", checked: true },
  { text: "Conoce cómo funciona la simulación", checked: true },
  { text: "Sin costo inicial", checked: true },
  { text: "No se garantizan equipos para tu proyecto", checked: false },
];

export function UploadChallengePage() {
  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-base-100 px-4 pb-16 pt-4 text-base-content lg:px-6">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[min(100%,56rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl space-y-8 py-0.5">
          <header className="space-y-4 text-center">
            <h1 className="text-[2.2rem] font-bold leading-tight text-white">
              Publica tu desafío
            </h1>
            <p className="mx-auto max-w-2xl text-base text-neutral-content md:text-lg">
              Conecta con talento calificado mediante simulaciones de trabajo real.
            </p>

            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              <Badge variant="duration" icon="schedule" text="5 semanas" />
              <Badge variant="remote" icon="groups" text="100 % remoto" />
              <Badge variant="start" icon="calendar_month" text="Inicio: 7 de diciembre" />
              <Badge variant="deadline" icon="info" text="13 días para publicar" />
            </div>
          </header>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="flex flex-col justify-between rounded-xl border border-neutral bg-gradient-to-br from-base-200/90 to-base-200/60 p-6 shadow-2xl backdrop-blur-sm md:p-8 lg:col-span-7">
              <div>
                <h2 className="mb-6 text-2xl font-semibold text-white">
                  Cómo funciona
                </h2>
                <ol className="space-y-6">
                  {steps.map((step, index) => (
                    <li key={step.title}>
                      <StepNumber
                        number={index + 1}
                        title={step.title}
                        description={step.description}
                      />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-neutral/60 pt-4 sm:flex-row">
                <span className="text-xs text-neutral-content">
                  ¿Tienes prisa? Sube los datos directamente.
                </span>
                <Link
                  to="/cargar-desafio"
                  className="btn w-full border-0 bg-brand-gradient text-white shadow-md transition-all hover:brightness-110 sm:w-auto"
                >
                  Subir como invitado
                  <span aria-hidden="true" className="material-symbols-outlined text-base">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </section>

            <section className="relative lg:col-span-5">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-accent/20 to-secondary/10 opacity-70 blur-sm" />
              <div className="relative flex h-full flex-col justify-between rounded-xl border border-accent/30 bg-base-200/90 p-6 shadow-2xl backdrop-blur-xl md:p-8">
                <div>
                  <div className="mb-6 space-y-1">
                    <h2 className="text-xl font-bold text-white">Prueba gratuita</h2>
                    <div className="text-4xl font-bold text-indigo-300">Gratis</div>
                  </div>

                  <p className="mb-6 text-sm text-indigo-200">
                    Explora sin riesgos
                  </p>

                  <ul className="space-y-3.5 leading-tight">
                    {benefits.map((benefit) => (
                      <BenefitItem key={benefit.text} {...benefit} />
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-neutral pt-4">
                  <button
                    type="button"
                    disabled
                    title="La creación de cuentas aún no está disponible"
                    className="btn w-full cursor-not-allowed border-0 bg-gradient-to-r from-accent to-secondary text-sm text-white opacity-60"
                  >
                    Crear cuenta y comenzar
                  </button>
                  <p className="mt-3 text-center text-[11px] text-neutral-content">
                    Ideal para conocer la plataforma antes de comprometerte.
                  </p>
                  <p className="mt-2 text-center text-[11px] text-neutral-content">
                    Próximamente podrás crear una cuenta.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
