// Composition root: el único lugar que conoce las implementaciones concretas
// y las conecta con los puertos que piden los casos de uso.
import type { LogIn } from "../application/ports/in/log-in.js";
import type { RegisterCompany } from "../application/ports/in/register-company.js";
import type { GeneradorDeIds } from "../application/ports/out/generador-de-ids.js";
import type { AuthProvider } from "../application/ports/out/auth-provider.js";
import type { CompanyRepository } from "../application/ports/out/company-repository.js";
import type { UserRepository } from "../application/ports/out/user-repository.js";
import { LogInUseCase } from "../application/use-cases/log-in.js";
import { RegisterCompanyUseCase } from "../application/use-cases/register-company.js";
import { InMemoryAuthProvider } from "../adapters/out/auth/in-memory-auth-provider.js";
import { SupabaseAuthProvider } from "../adapters/out/auth/supabase-auth-provider.js";
import { GeneradorDeIdsUuid } from "../adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryUserRepository } from "../adapters/out/persistence/memory/in-memory-user-repository.js";
import { SupabaseCompanyRepository } from "../adapters/out/persistence/supabase/supabase-company-repository.js";
import { SupabaseUserRepository } from "../adapters/out/persistence/supabase/supabase-user-repository.js";
import type { Config } from "./config/env.js";
import { crearClienteSupabase } from "./supabase/client.js";

/** Puertos de salida que necesitan los casos de uso. */
export interface Dependencias {
  users: UserRepository;
  companies: CompanyRepository;
  auth: AuthProvider;
  ids: GeneradorDeIds;
}

/** Puertos de entrada que consume el adaptador HTTP. */
export interface CasosDeUso {
  registerCompany: RegisterCompany;
  logIn: LogIn;
}

export function crearDependencias(config: Config): Dependencias {
  const ids = new GeneradorDeIdsUuid();

  if (config.supabase === null) {
    const users = new InMemoryUserRepository();
    return {
      ids,
      users,
      auth: new InMemoryAuthProvider(users, ids),
      companies: new InMemoryCompanyRepository(),
    };
  }

  const { url, claveSecreta } = config.supabase;
  const supabase = crearClienteSupabase(url, claveSecreta);
  return {
    ids,
    auth: new SupabaseAuthProvider(supabase, () => crearClienteSupabase(url, claveSecreta)),
    users: new SupabaseUserRepository(supabase),
    companies: new SupabaseCompanyRepository(supabase),
  };
}

export function crearCasosDeUso({ companies, auth, ids }: Dependencias): CasosDeUso {
  return {
    registerCompany: new RegisterCompanyUseCase(auth, companies, ids),
    logIn: new LogInUseCase(auth),
  };
}
