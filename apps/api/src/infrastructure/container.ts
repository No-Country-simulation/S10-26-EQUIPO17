// Composition root: el único lugar que conoce las implementaciones concretas
// y las conecta con los puertos que piden los casos de uso.
import type { CrearEmpresa } from "../application/ports/in/crear-empresa.js";
import type { ObtenerEmpresa } from "../application/ports/in/obtener-empresa.js";
import type { RegistrarUsuario } from "../application/ports/in/registrar-usuario.js";
import type { GeneradorDeIds } from "../application/ports/out/generador-de-ids.js";
import type { HasherDeClaves } from "../application/ports/out/hasher-de-claves.js";
import type { RepositorioDeEmpresas } from "../application/ports/out/repositorio-de-empresas.js";
import type { RepositorioDeUsuarios } from "../application/ports/out/repositorio-de-usuarios.js";
import { CrearEmpresaCasoDeUso } from "../application/use-cases/crear-empresa.js";
import { ObtenerEmpresaCasoDeUso } from "../application/use-cases/obtener-empresa.js";
import { RegistrarUsuarioCasoDeUso } from "../application/use-cases/registrar-usuario.js";
import { GeneradorDeIdsUuid } from "../adapters/out/ids/generador-de-ids-uuid.js";
import { RepositorioDeEmpresasEnMemoria } from "../adapters/out/persistence/memory/repositorio-de-empresas-en-memoria.js";
import { RepositorioDeUsuariosEnMemoria } from "../adapters/out/persistence/memory/repositorio-de-usuarios-en-memoria.js";
import { RepositorioDeEmpresasSupabase } from "../adapters/out/persistence/supabase/repositorio-de-empresas-supabase.js";
import { RepositorioDeUsuariosSupabase } from "../adapters/out/persistence/supabase/repositorio-de-usuarios-supabase.js";
import { HasherDeClavesScrypt } from "../adapters/out/security/hasher-de-claves-scrypt.js";
import type { Config } from "./config/env.js";
import { crearClienteSupabase } from "./supabase/client.js";

/** Puertos de salida que necesitan los casos de uso. */
export interface Dependencias {
  usuarios: RepositorioDeUsuarios;
  empresas: RepositorioDeEmpresas;
  hasher: HasherDeClaves;
  ids: GeneradorDeIds;
}

/** Puertos de entrada que consume el adaptador HTTP. */
export interface CasosDeUso {
  registrarUsuario: RegistrarUsuario;
  crearEmpresa: CrearEmpresa;
  obtenerEmpresa: ObtenerEmpresa;
}

export function crearDependencias(config: Config): Dependencias {
  const comunes = { hasher: new HasherDeClavesScrypt(), ids: new GeneradorDeIdsUuid() };

  if (config.supabase === null) {
    return {
      ...comunes,
      usuarios: new RepositorioDeUsuariosEnMemoria(),
      empresas: new RepositorioDeEmpresasEnMemoria(),
    };
  }

  const supabase = crearClienteSupabase(config.supabase.url, config.supabase.claveSecreta);
  return {
    ...comunes,
    usuarios: new RepositorioDeUsuariosSupabase(supabase),
    empresas: new RepositorioDeEmpresasSupabase(supabase),
  };
}

export function crearCasosDeUso({ usuarios, empresas, hasher, ids }: Dependencias): CasosDeUso {
  return {
    registrarUsuario: new RegistrarUsuarioCasoDeUso(usuarios, hasher, ids),
    crearEmpresa: new CrearEmpresaCasoDeUso(empresas, usuarios, ids),
    obtenerEmpresa: new ObtenerEmpresaCasoDeUso(empresas),
  };
}
