export type Persistencia = "supabase" | "memoria";

export interface Config {
  puerto: number;
  persistencia: Persistencia;
  supabase: { url: string; claveSecreta: string } | null;
}

function requerida(env: NodeJS.ProcessEnv, nombre: string): string {
  const valor = env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  }
  return valor;
}

export function leerConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const persistencia = env.PERSISTENCIA ?? "supabase";
  if (persistencia !== "supabase" && persistencia !== "memoria") {
    throw new Error(`PERSISTENCIA debe ser "supabase" o "memoria", no "${persistencia}"`);
  }

  return {
    puerto: Number(env.PORT ?? 3000),
    persistencia,
    supabase:
      persistencia === "supabase"
        ? {
            url: requerida(env, "SUPABASE_URL"),
            claveSecreta: requerida(env, "SUPABASE_SECRET_KEY"),
          }
        : null,
  };
}
