import { Link } from "react-router-dom";
import { roles } from "../data/landingData";
import { RoleMockup } from "./RoleMockups";

export function RolesSection() {
  return (
    <section className="mx-auto max-w-[1440px] space-y-8 px-6 py-16 lg:px-8">
      {roles.map((r) => {
        const ctaClass = `btn btn-lg ${r.cta.className}`;
        const ctaContent = (
          <>
            <span className="material-symbols-outlined text-[20px]">{r.cta.icon}</span>
            {r.cta.label}
          </>
        );

        return (
          <article
            key={r.id}
            id={r.id}
            className="scroll-mt-24 rounded-3xl border border-neutral bg-base-200 p-8 shadow-2xl lg:p-12"
          >
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className={`flex flex-col gap-5 lg:col-span-7 ${r.mockupFirst ? "lg:order-2" : ""}`}>
                <span className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${r.badgeClass}`}>
                  <span className="material-symbols-outlined text-[16px]">{r.badgeIcon}</span>
                  {r.badgeLabel}
                </span>
                <h3 className="text-2xl font-extrabold leading-tight text-white lg:text-3xl">{r.title}</h3>
                <p className="text-base text-neutral-content">{r.description}</p>

                <ul className="mt-2 space-y-3">
                  {r.features.map((f) => (
                    <li key={f.title} className="flex items-start gap-3">
                      <div className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-neutral bg-base-300 ${r.iconClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold text-white">{f.title}: </span>
                        <span className="text-neutral-content">{f.text}</span>
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {r.cta.href.startsWith("/") ? (
                    <Link to={r.cta.href} className={ctaClass}>{ctaContent}</Link>
                  ) : (
                    <a href={r.cta.href} className={ctaClass}>{ctaContent}</a>
                  )}
                </div>
              </div>

              <div className={`lg:col-span-5 ${r.mockupFirst ? "lg:order-1" : ""}`}>
                <RoleMockup id={r.id} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
