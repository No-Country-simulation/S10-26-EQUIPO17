import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// La API usa la clave secreta: las tablas tienen RLS sin políticas,
// así que solo el backend puede leerlas y escribirlas.
export function crearClienteSupabase(url: string, claveSecreta: string): SupabaseClient {
  return createClient(url, claveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
