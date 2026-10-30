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
  /** Orígenes exactos que pueden llamar a la API con las cookies de sesión. */
  corsOrigins: string[];
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

// Cada origen autorizado puede leer respuestas hechas con la sesión del usuario, así que
// solo se aceptan orígenes exactos: nada de "*", "null", comodines, paths ni barras finales.
function leerCorsOrigins(env: NodeJS.ProcessEnv): string[] {
  const valor = env.CORS_ORIGINS?.trim();
  if (!valor) return [];

  return valor.split(",").map((parte) => {
    const origen = parte.trim();
    let url: URL | null = null;
    try {
      url = new URL(origen);
    } catch {
      // Se informa abajo junto con el resto de los valores inválidos.
    }
    // URL acepta "*" dentro del host, por eso se rechaza aparte.
    const esExacto =
      url !== null &&
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === origen &&
      !origen.includes("*");
    if (!esExacto) {
      throw new Error(
        `CORS_ORIGINS solo admite orígenes exactos como "https://web.com", no "${origen}"`,
      );
    }
    return origen;
  });
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
    corsOrigins: leerCorsOrigins(env),
  };
}
