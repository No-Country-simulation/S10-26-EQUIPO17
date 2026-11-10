// Los `value` son exactamente los enums de la API (sensibles a mayúsculas); los `label` están en español.
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

export const orgTypeOptions: SelectOption<"StartUp" | "Company" | "Educational Institute">[] = [
  { value: "StartUp", label: "StartUp", description: "En etapa inicial o crecimiento acelerado.", icon: "bolt" },
  { value: "Company", label: "Empresa", description: "Corporación o negocio consolidado.", icon: "corporate_fare" },
  { value: "Educational Institute", label: "Instituto educativo", description: "Entidad académica o formativa.", icon: "school" },
];

export const countryOptions: SelectOption<"Argentina" | "Brazil" | "Chile" | "USA" | "Canada">[] = [
  { value: "Argentina", label: "Argentina (GMT-3)" },
  { value: "Brazil", label: "Brasil (GMT-3)" },
  { value: "Chile", label: "Chile (GMT-4)" },
  { value: "USA", label: "USA (EST / PST)" },
  { value: "Canada", label: "Canadá (EST)" },
];

export const sectorOptions: SelectOption<"Product" | "IT" | "Marketing" | "Software Development">[] = [
  { value: "Software Development", label: "Desarrollo de Software", icon: "terminal" },
  { value: "Product", label: "Producto", icon: "inventory_2" },
  { value: "IT", label: "IT & Cloud Ops", icon: "cloud" },
  { value: "Marketing", label: "Marketing Tech", icon: "campaign" },
];

export const stageOptions: SelectOption<"Idea" | "MVP" | "POC" | "Scaling" | "Legacy">[] = [
  { value: "Idea", label: "Idea", description: "Conceptual", icon: "lightbulb" },
  { value: "MVP", label: "MVP", description: "En desarrollo", icon: "build" },
  { value: "POC", label: "POC", description: "Validación", icon: "science" },
  { value: "Scaling", label: "Escalando", description: "Tracción real", icon: "trending_up" },
  { value: "Legacy", label: "Legacy", description: "Migración", icon: "history" },
];

export const verticalOptions: SelectOption[] = [
  { value: "E-commerce", label: "E-commerce", icon: "shopping_cart" },
  { value: "Fintech", label: "Fintech", icon: "payments" },
  { value: "Healthtech", label: "Healthtech", icon: "medical_services" },
  { value: "Edtech", label: "Edtech", icon: "cast_for_education" },
  { value: "Logistics", label: "Logística", icon: "local_shipping" },
];

export function labelOf(options: SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
