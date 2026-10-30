export const metrics = [
  { label: "Equipos Colaborando", value: "142", hint: "Frontend, Backend, UX/UI, QA, PM", icon: "groups", delta: "+18% por generación", tone: "text-secondary", gradient: false },
  { label: "Horas de Simulación", value: "18,450 hrs", hint: "Ejecución continua en squads ágiles", icon: "timer", delta: "", tone: "text-primary", gradient: true },
  { label: "Métricas y resultados", value: "98.4%", hint: "Tasa de entrega de prototipos funcionales", icon: "verified", delta: "", tone: "text-secondary", gradient: false },
];

export const teamActivity = [
  { code: "C18-F", name: "Team c18-fintech", detail: "Sprint Review aprobada · Despliegue en AWS & Microservicios", status: "Done · 14m ago", text: "text-secondary", badge: "badge-secondary" },
  { code: "H04", name: "Team healthtech-04", detail: "Pull Request #42 merged · QA Suite automatizado validado", status: "Merged · 28m ago", text: "text-primary", badge: "badge-primary" },
  { code: "E02", name: "Team edtech-ai-02", detail: "Daily Standup completada · 5 miembros sincronizados en Figma & Jira", status: "Active", text: "text-accent", badge: "badge-accent" },
];

export const skills = [
  { label: "Comunicación Asertiva & Slack Sync", value: 94 },
  { label: "Adaptabilidad & Resolución en Equipo", value: 91 },
  { label: "Entrega Bajo Presión & Sprint Milestones", value: 89 },
  { label: "Manejo de Git Flow & Code Reviews", value: 96 },
];

export const heroTags = [
  { label: "Trabajo a distancia", badge: "badge-secondary" },
  { label: "Trabajo en equipo", badge: "badge-accent" },
  { label: "Evaluación basada en resultados reales", badge: "badge-warning" },
];

export const simulationPillars = [
  {
    icon: "integration_instructions",
    tag: "Semana 1 a 5",
    title: "Desafíos Concretos",
    description: "Los equipos trabajan sobre proyectos reales, comunican avances, toman decisiones y construyen entregables funcionales.",
    highlight: "Sprints, Pull Requests, Demos semanales",
    text: "text-secondary",
    hoverText: "group-hover:text-secondary",
    hoverBorder: "group-hover:border-primary",
  },
  {
    icon: "insights",
    tag: "Telemetry Engine",
    title: "Captura de Señales",
    description: "La plataforma registra interacciones, nivel de colaboración, comunicación y ritmo de ejecución de cada participante.",
    highlight: "Métricas de soft skills en tiempo de sprint",
    text: "text-primary",
    hoverText: "group-hover:text-primary",
    hoverBorder: "group-hover:border-primary",
  },
  {
    icon: "workspace_premium",
    tag: "Verified Portfolio",
    title: "Resultados observables",
    description: "Convertimos la actividad observada en evidencia medible de empleabilidad y desempeño para empresas e instituciones.",
    highlight: "Badge de certificación respaldado por código",
    text: "text-secondary",
    hoverText: "group-hover:text-secondary",
    hoverBorder: "group-hover:border-secondary",
  },
];

export type RoleId = "empresas" | "instituciones" | "talento";

export interface Role {
  id: RoleId;
  badgeIcon: string;
  badgeLabel: string;
  badgeClass: string;
  iconClass: string;
  title: string;
  description: string;
  features: { icon: string; title: string; text: string }[];
  cta: { icon: string; label: string; href: string; className: string };
  mockupFirst?: boolean;
}

export const roles: Role[] = [
  {
    id: "empresas",
    badgeIcon: "business_center",
    badgeLabel: "Para Empresas y Emprendedores",
    badgeClass: "border-secondary/30 bg-secondary/10 text-secondary",
    iconClass: "text-secondary",
    title: "Valida tus proyectos con equipos de profesionales emergentes en 5 semanas.",
    description: "Conectamos a tu empresa con equipos multidisciplinarios para prototipar, desarrollar y probar tu software sin asumir costos ni tiempos de contratación.",
    features: [
      { icon: "bolt", title: "Prototipado en 5 semanas", text: "Pon a un equipo multidisciplinario a resolver tus desafíos y entregar prototipos funcionales." },
      { icon: "visibility", title: "Evaluación sin sesgo", text: "Observa cómo trabajan los candidatos en situaciones reales antes de contratar." },
      { icon: "chat", title: "Feedback ágil", text: "Revisa avances digestibles, entregables terminados y demos en vivo sin revisar código en crudo." },
    ],
    cta: {
      icon: "add_task",
      label: "Publicar un Desafío (2 min)",
      href: "/cargar-desafio",
      className: "bg-brand-gradient border-0 text-white shadow-lg",
    },
  },
  {
    id: "instituciones",
    badgeIcon: "school",
    badgeLabel: "Para centros de estudio",
    badgeClass: "border-accent/30 bg-accent/10 text-indigo-300",
    iconClass: "text-indigo-300",
    title: "Incorpora práctica profesional y métricas de empleabilidad reales a tus programas.",
    description: "Bootcamps, academias y universidades utilizan No Country como el módulo final de práctica obligatoria para que sus egresados salgan con experiencia tangible.",
    features: [
      { icon: "fact_check", title: "Evidencia de Empleabilidad", text: "Pasa de evaluar solo teoría a entregar evidencia basada en comportamiento observado." },
      { icon: "hub", title: "Conexión con el Ecosistema", text: "Conecta a tus estudiantes con empresas, mentores y jurados dentro de la plataforma." },
      { icon: "grid_view", title: "Visualización Multiroles", text: "Paneles de seguimiento para que tus profesores y coordinadores observen la evolución de los equipos." },
    ],
    cta: {
      icon: "calendar_month",
      label: "Agendar Demo Institucional",
      href: "#",
      className: "border-neutral bg-base-300 hover:border-secondary hover:text-white",
    },
    mockupFirst: true,
  },
  {
    id: "talento",
    badgeIcon: "badge",
    badgeLabel: "Para profesionales emergentes",
    badgeClass: "border-secondary/30 bg-secondary/10 text-secondary",
    iconClass: "text-secondary",
    title: "Suma experiencia real, crea portafolio verificable y acelera tu carrera de forma 100% gratuita.",
    description: "Diseñado para juniors, autodidactas y profesionales en transición que necesitan validar cómo operan en equipo antes de su primera entrevista técnica formal.",
    features: [
      { icon: "terminal", title: "Proyectos Reales", text: "Colabora con perfiles de otros países y disciplinas (Frontend, Backend, UX/UI, PM, QA)." },
      { icon: "history_edu", title: "Trayectoria Observable", text: "Construye un historial de trabajo con evidencia real de tus habilidades blandas y técnicas." },
      { icon: "public", title: "Conexiones internacionales", text: "Conéctate con mentores, pares y empresas que buscan profesionales con experiencia comprobable." },
    ],
    cta: {
      icon: "how_to_reg",
      label: "Postular a la próxima generación (Gratis)",
      href: "#",
      className: "bg-brand-gradient border-0 text-white shadow-[0_0_20px_rgba(255,0,148,0.4)]",
    },
  },
];
