export type Persistencia = "supabase" | "memoria";

export type SameSite = "lax" | "strict" | "none";

/** Atributos de las cookies de sesión; dependen de cómo se despliegan la web y la API. */
export interface OpcionesDeCookie {
  secure: boolean;
  sameSite: SameSite;
}

export interface Config {
  puerto: number;
  persistencia: Persistencia;
  supabase: { url: string; claveSecreta: string } | null;
  cookies: OpcionesDeCookie;
}

function requerida(env: NodeJS.ProcessEnv, nombre: string): string {
  const valor = env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  }
  return valor;
}

function leerCookies(env: NodeJS.ProcessEnv): OpcionesDeCookie {
  const sameSite = env.COOKIE_SAME_SITE ?? "lax";
  if (sameSite !== "lax" && sameSite !== "strict" && sameSite !== "none") {
    throw new Error(`COOKIE_SAME_SITE debe ser "lax", "strict" o "none", no "${sameSite}"`);
  }
  const secure = env.COOKIE_SECURE !== "false";
  if (sameSite === "none" && !secure) {
    // Los navegadores descartan las cookies SameSite=None que no son Secure.
    throw new Error('COOKIE_SAME_SITE="none" requiere COOKIE_SECURE distinto de "false"');
  }
  return { secure, sameSite };
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
    cookies: leerCookies(env),
  };
}
