import type { SupabaseClient } from "@supabase/supabase-js";
import type { RepositorioDeEmpresas } from "../../../../application/ports/out/repositorio-de-empresas.js";
import type { Empresa } from "../../../../domain/entities/empresa.js";
import {
  COLUMNAS_EMPRESA_CON_USER,
  empresaAFila,
  filaAEmpresa,
  TEXTO_NO_ES_UUID,
  traducirError,
  type FilaEmpresaConUser,
} from "./filas.js";

export class RepositorioDeEmpresasSupabase implements RepositorioDeEmpresas {
  constructor(private readonly supabase: SupabaseClient) {}

  async guardar(empresa: Empresa): Promise<void> {
    const { error } = await this.supabase
      .from("empresas")
      .upsert(empresaAFila(empresa));
    if (error) throw traducirError(error);
  }

  async buscarPorId(id: string): Promise<Empresa | null> {
    const { data, error } = await this.supabase
      .from("empresas")
      .select(COLUMNAS_EMPRESA_CON_USER)
      .eq("id", id)
      .maybeSingle<FilaEmpresaConUser>();
    // Un id que no es UUID no puede existir en la tabla.
    if (error?.code === TEXTO_NO_ES_UUID) return null;
    if (error) throw traducirError(error);
    return data ? filaAEmpresa(data) : null;
  }
}
