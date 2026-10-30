import { Link } from "react-router-dom";
import { heroTags } from "../data/landingData";
import { LiveDashboard } from "./LiveDashboard";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-[140px]" />
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-3">
          {heroTags.map((t) => (
            <span key={t.label} className={`badge badge-soft badge-outline text-xs font-semibold uppercase tracking-wider ${t.badge}`}>
              [ {t.label} ]
            </span>
          ))}
        </div>

        <div className="mb-12 max-w-4xl">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            La plataforma de <span className="text-gradient">experiencia de trabajo real</span> que conecta
            profesionales emergentes, centros de estudio y empresas.
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-neutral-content lg:text-xl">
            Transformamos los estudios teóricos en un portafolio comprobable mediante equipos que trabajan a distancia,
            colaboran y crean proyectos reales.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/cargar-desafio" className="btn btn-lg bg-brand-gradient border-0 text-white shadow-[0_0_25px_rgba(255,0,148,0.4)]">
              <span className="material-symbols-outlined">rocket_launch</span> Validar mi proyecto o idea
            </Link>
            <a href="#public-dashboard" className="btn btn-lg border-neutral bg-base-300 hover:border-secondary">
              <span className="material-symbols-outlined text-secondary">sensors</span> Ver Public Dashboard en Vivo
            </a>
          </div>
        </div>

        <LiveDashboard />
      </div>
    </section>
  );
}
