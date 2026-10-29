import { metrics, teamActivity, skills } from "../data/landingData";

export function LiveDashboard() {
  return (
    <div id="public-dashboard" className="card border border-neutral bg-base-200 p-6 shadow-2xl lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-neutral bg-base-300 px-4 py-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-content">
          <span className="size-3 rounded-full bg-primary" />
          <span className="size-3 rounded-full bg-warning" />
          <span className="size-3 rounded-full bg-secondary" />
          <span className="ml-2">telemetry.nocountry.tech / live-radar</span>
        </div>
        <div className="flex gap-3">
          <span className="badge badge-outline border-neutral bg-base-100 uppercase text-secondary">
            <span className="status status-secondary animate-ping" /> Cohort C18 · 24 Equipos
          </span>
          <span className="badge hidden border-neutral bg-base-200 sm:inline-flex">
            Semana 3 de 5 · Entrega de MVP
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="stats border border-neutral bg-base-300">
            <div className="stat">
              <div className="stat-figure grid size-12 place-items-center rounded-xl border border-neutral bg-base-100">
                <span className={`material-symbols-outlined ${m.tone}`}>{m.icon}</span>
              </div>
              <div className="stat-title text-xs uppercase tracking-wider">{m.label}</div>
              <div className={`stat-value text-3xl tabular-nums ${m.gradient ? "text-gradient" : m.tone}`}>
                {m.value}
              </div>
              <div className="stat-desc whitespace-normal">
                {m.delta && <span className="text-secondary">{m.delta} · </span>}
                {m.hint}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="card border border-neutral bg-base-300 p-5 lg:col-span-7">
          <header className="mb-3 flex items-center justify-between border-b border-neutral pb-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span className="material-symbols-outlined text-secondary">radar</span>
              Radar de Dinámicas de Trabajo en Vivo
            </h3>
            <span className="badge badge-secondary badge-soft text-[11px] uppercase">Live Sprints</span>
          </header>
          <ul className="space-y-2.5">
            {teamActivity.map((t) => (
              <li
                key={t.code}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral bg-base-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`grid size-9 shrink-0 place-items-center rounded-lg border border-neutral bg-base-300 text-xs font-bold ${t.text}`}>
                    {t.code}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-neutral-content">{t.detail}</p>
                  </div>
                </div>
                <span className={`badge badge-soft shrink-0 text-xs ${t.badge}`}>{t.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border border-neutral bg-base-300 p-5 lg:col-span-5">
          <header className="mb-3 flex items-center justify-between border-b border-neutral pb-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Métricas de Competencias
            </h3>
            <span className="text-xs text-neutral-content">Evaluación Continua</span>
          </header>
          <div className="space-y-4">
            {skills.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="font-bold tabular-nums text-secondary">{s.value}%</span>
                </div>
                <progress className="progress progress-secondary h-2 w-full bg-base-200" value={s.value} max={100} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
