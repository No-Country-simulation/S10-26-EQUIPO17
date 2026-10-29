export function CtaBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-base-100 py-20">
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[350px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-t from-primary/15 via-secondary/10 to-transparent opacity-60 blur-[140px]" />
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-8">
        <div className="card flex flex-col items-center border border-neutral bg-base-200 p-10 text-center shadow-2xl lg:p-16">
          <span className="badge badge-outline mb-6 gap-2 border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
            <span className="status status-secondary animate-pulse" />
            Próxima Cohorte Inicia en 12 Días
          </span>
          <h2 className="mb-4 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Únete a la evolución del trabajo remoto y la formación basada en evidencia.
          </h2>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-neutral-content lg:text-lg">
            Sé parte de los más de 15,000 profesionales que reemplazaron la teoría por código real y dinámicas de
            equipo verificadas.
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#talento"
              className="btn btn-lg gap-2 border-0 bg-brand-gradient text-base font-bold text-white shadow-[0_0_30px_rgba(255,0,148,0.4)] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
              Sumarme como Talento (Gratis)
            </a>
            <a
              href="#empresas"
              className="btn btn-lg gap-2 border border-secondary/40 bg-secondary/10 text-base font-bold text-secondary shadow-[0_0_24px_rgba(2,190,239,0.16)] transition-all hover:border-secondary hover:bg-secondary/20 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[22px]">business_center</span>
              Comparte tu Proyecto
            </a>
            <a
              href="#instituciones"
              className="btn btn-lg gap-2 border border-accent/40 bg-accent/10 text-base font-bold text-indigo-300 shadow-[0_0_24px_rgba(99,102,241,0.16)] transition-all hover:border-accent hover:bg-accent/20 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[22px]">school</span>
              Soy Institución
            </a>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-6 border-t border-neutral pt-6 text-neutral-content md:flex-row lg:gap-12">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
              <span className="text-xs font-medium lg:text-sm">100% Gratuito para Talento Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              <span className="text-xs font-medium lg:text-sm">Metodología Ágil Homologada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
              <span className="text-xs font-medium lg:text-sm">Acceso a Red de Empleabilidad Activa</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
