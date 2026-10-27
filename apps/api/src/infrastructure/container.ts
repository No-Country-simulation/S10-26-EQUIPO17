// Composition root: el único lugar que conoce las implementaciones concretas
// y las conecta con los puertos que piden los casos de uso.
import type { CrearEmpresa } from "../application/ports/in/crear-empresa.js";
import type { ObtenerEmpresa } from "../application/ports/in/obtener-empresa.js";
import type { RegisterUser } from "../application/ports/in/register-user.js";
import type { GeneradorDeIds } from "../application/ports/out/generador-de-ids.js";
import type { HasherDeClaves } from "../application/ports/out/hasher-de-claves.js";
import type { RepositorioDeEmpresas } from "../application/ports/out/repositorio-de-empresas.js";
import type { UserRepository } from "../application/ports/out/user-repository.js";
import { CrearEmpresaCasoDeUso } from "../application/use-cases/crear-empresa.js";
import { ObtenerEmpresaCasoDeUso } from "../application/use-cases/obtener-empresa.js";
import { RegisterUserUseCase } from "../application/use-cases/register-user.js";
import { GeneradorDeIdsUuid } from "../adapters/out/ids/generador-de-ids-uuid.js";
import { RepositorioDeEmpresasEnMemoria } from "../adapters/out/persistence/memory/repositorio-de-empresas-en-memoria.js";
import { InMemoryUserRepository } from "../adapters/out/persistence/memory/in-memory-user-repository.js";
import { RepositorioDeEmpresasSupabase } from "../adapters/out/persistence/supabase/repositorio-de-empresas-supabase.js";
import { SupabaseUserRepository } from "../adapters/out/persistence/supabase/supabase-user-repository.js";
import { HasherDeClavesScrypt } from "../adapters/out/security/hasher-de-claves-scrypt.js";
import type { Config } from "./config/env.js";
import { crearClienteSupabase } from "./supabase/client.js";

/** Puertos de salida que necesitan los casos de uso. */
export interface Dependencias {
  users: UserRepository;
  empresas: RepositorioDeEmpresas;
  hasher: HasherDeClaves;
  ids: GeneradorDeIds;
}

/** Puertos de entrada que consume el adaptador HTTP. */
export interface CasosDeUso {
  registerUser: RegisterUser;
  crearEmpresa: CrearEmpresa;
  obtenerEmpresa: ObtenerEmpresa;
}

export function crearDependencias(config: Config): Dependencias {
  const comunes = { hasher: new HasherDeClavesScrypt(), ids: new GeneradorDeIdsUuid() };

  if (config.supabase === null) {
    return {
      ...comunes,
      users: new InMemoryUserRepository(),
      empresas: new RepositorioDeEmpresasEnMemoria(),
    };
  }

  const supabase = crearClienteSupabase(config.supabase.url, config.supabase.claveSecreta);
  return {
    ...comunes,
    users: new SupabaseUserRepository(supabase),
    empresas: new RepositorioDeEmpresasSupabase(supabase),
  };
}

export function crearCasosDeUso({ users, empresas, hasher, ids }: Dependencias): CasosDeUso {
  return {
    registerUser: new RegisterUserUseCase(users, hasher, ids),
    crearEmpresa: new CrearEmpresaCasoDeUso(empresas, users, ids),
    obtenerEmpresa: new ObtenerEmpresaCasoDeUso(empresas),
  };
}
