export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

export const wizardSteps = [
  { title: "Tu perfil profesional", shortTitle: "Perfil", icon: "badge" },
  { title: "Organización y entorno", shortTitle: "Entorno", icon: "apartment" },
  { title: "Proyecto", shortTitle: "Proyecto", icon: "code_blocks" },
  { title: "Activación y cuenta", shortTitle: "Activación", icon: "lock_open" },
] as const;

export const orgTypeOptions: SelectOption<"startup" | "empresa" | "instituto">[] = [
  { value: "startup", label: "StartUp", description: "En etapa inicial o crecimiento acelerado.", icon: "bolt" },
  { value: "empresa", label: "Empresa", description: "Corporación o negocio consolidado.", icon: "corporate_fare" },
  { value: "instituto", label: "Instituto / ONG", description: "Entidad académica o sin fines de lucro.", icon: "school" },
];

export const countryOptions: SelectOption[] = [
  { value: "Argentina", label: "Argentina (GMT-3)" },
  { value: "Brasil", label: "Brasil (GMT-3)" },
  { value: "Chile", label: "Chile (GMT-4)" },
  { value: "USA", label: "USA (EST / PST)" },
  { value: "Canadá", label: "Canadá (EST)" },
  { value: "Colombia", label: "Colombia (GMT-5)" },
  { value: "México", label: "México (GMT-6)" },
  { value: "España", label: "España (GMT+1)" },
];

export const sectorOptions: SelectOption[] = [
  { value: "Desarrollo de Software", label: "Desarrollo de Software", icon: "terminal" },
  { value: "Producto", label: "Producto", icon: "inventory_2" },
  { value: "IT & Cloud Ops", label: "IT & Cloud Ops", icon: "cloud" },
  { value: "Marketing Tech", label: "Marketing Tech", icon: "campaign" },
  { value: "Finanzas & Facturación", label: "Finanzas & Facturación", icon: "receipt_long" },
];

export const stageOptions: SelectOption<"idea" | "mvp" | "poc" | "escalando" | "legacy">[] = [
  { value: "idea", label: "Idea", description: "Conceptual", icon: "lightbulb" },
  { value: "mvp", label: "MVP", description: "En desarrollo", icon: "build" },
  { value: "poc", label: "POC", description: "Validación", icon: "science" },
  { value: "escalando", label: "Escalando", description: "Tracción real", icon: "trending_up" },
  { value: "legacy", label: "Legacy", description: "Migración", icon: "history" },
];

export const verticalOptions: SelectOption[] = [
  { value: "IoT / Telemetría", label: "IoT / Telemetría", icon: "sensors" },
  { value: "Fintech", label: "Fintech", icon: "payments" },
  { value: "E-commerce", label: "E-commerce", icon: "shopping_cart" },
  { value: "Healthtech", label: "Healthtech", icon: "medical_services" },
  { value: "Edtech", label: "Edtech", icon: "cast_for_education" },
  { value: "Logística", label: "Logística", icon: "local_shipping" },
];
