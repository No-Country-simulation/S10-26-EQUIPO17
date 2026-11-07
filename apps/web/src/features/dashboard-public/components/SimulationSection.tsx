import { simulationPillars } from "../data/landingData";

export function SimulationSection() {
  return (
    <section id="simulacion" className="w-full scroll-mt-20 bg-base-100 py-20">
      <div className="mx-auto max-w-360 px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary">
            Infraestructura de Aprendizaje Activo
          </span>
          <h2 className="mb-4 text-3xl font-extrabold text-white lg:text-4xl">¿Qué es una experiencia de trabajo real?</h2>
          <div className="rounded-2xl border border-neutral bg-base-200 p-5 text-base leading-relaxed text-neutral-content lg:text-lg">
            Es una experiencia que reproduce la dinámica del trabajo real. A diferencia de un curso o un proyecto
            aislado, reúne equipos con distintas especialidades que colaboran, crean y comparten sus avances.
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {simulationPillars.map((p) => (
            <article
              key={p.title}
              className="group card justify-between border border-neutral bg-base-300 p-6 shadow-xl transition-all hover:border-primary/50"
            >
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div className={`grid size-12 place-items-center rounded-xl border border-neutral bg-base-200 transition-all ${p.text} ${p.hoverBorder}`}>
                    <span className="material-symbols-outlined text-[26px]">{p.icon}</span>
                  </div>
                  <span className={`badge border-neutral bg-base-200 text-xs font-semibold uppercase ${p.text}`}>
                    {p.tag}
                  </span>
                </div>
                <h3 className={`mb-2 text-xl font-bold text-white transition-colors ${p.hoverText}`}>{p.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-neutral-content">{p.description}</p>
              </div>
              <div className="flex items-center gap-2 border-t border-neutral pt-4 text-xs">
                <span className={`material-symbols-outlined text-[18px] ${p.text}`}>check_circle</span>
                {p.highlight}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
