// Composition root: el único lugar que conoce las implementaciones concretas
// y las conecta con los puertos que piden los casos de uso.
import type { Authenticate } from "../application/ports/in/authenticate.js";
import type { LogIn } from "../application/ports/in/log-in.js";
import type { LogOut } from "../application/ports/in/log-out.js";
import type { RefreshUserSession } from "../application/ports/in/refresh-user-session.js";
import type { RegisterCompany } from "../application/ports/in/register-company.js";
import type { UploadProject } from "../application/ports/in/upload-project.js";
import type { GeneradorDeIds } from "../application/ports/out/generador-de-ids.js";
import type { AuthProvider } from "../application/ports/out/auth-provider.js";
import type { CompanyRepository } from "../application/ports/out/company-repository.js";
import type { ProjectRepository } from "../application/ports/out/project-repository.js";
import type { UserRepository } from "../application/ports/out/user-repository.js";
import { AuthenticateUseCase } from "../application/use-cases/authenticate.js";
import { LogInUseCase } from "../application/use-cases/log-in.js";
import { LogOutUseCase } from "../application/use-cases/log-out.js";
import { RefreshUserSessionUseCase } from "../application/use-cases/refresh-user-session.js";
import { RegisterCompanyUseCase } from "../application/use-cases/register-company.js";
import { UploadProjectUseCase } from "../application/use-cases/upload-project.js";
import { InMemoryAuthProvider } from "../adapters/out/auth/in-memory-auth-provider.js";
import { SupabaseAuthProvider } from "../adapters/out/auth/supabase-auth-provider.js";
import { GeneradorDeIdsUuid } from "../adapters/out/ids/generador-de-ids-uuid.js";
import { InMemoryCompanyRepository } from "../adapters/out/persistence/memory/in-memory-company-repository.js";
import { InMemoryProjectRepository } from "../adapters/out/persistence/memory/in-memory-project-repository.js";
import { InMemoryUserRepository } from "../adapters/out/persistence/memory/in-memory-user-repository.js";
import { SupabaseCompanyRepository } from "../adapters/out/persistence/supabase/supabase-company-repository.js";
import { SupabaseProjectRepository } from "../adapters/out/persistence/supabase/supabase-project-repository.js";
import { SupabaseUserRepository } from "../adapters/out/persistence/supabase/supabase-user-repository.js";
import type { Config } from "./config/env.js";
import { crearClienteSupabase } from "./supabase/client.js";
import type { ListProjects } from "../application/ports/in/list-projects.js";
import { ListProjectsUseCase } from "../application/use-cases/list-projects.js";
import type { ProjectEditRequestRepository } from "../application/ports/out/project-edit-request-repository.js";
import { InMemoryProjectEditRequestRepository } from "../adapters/out/persistence/memory/in-memory-project-edit-request-repository.js";
import { SupabaseProjectEditRequestRepository } from "../adapters/out/persistence/supabase/supabase-project-edit-request-repository.js";
import type { SubmitProjectEditRequest } from "../application/ports/in/submit-project-edit-request.js";
import type { ReviewProjectEditRequest } from "../application/ports/in/review-project-edit-request.js";
import { SubmitProjectEditRequestUseCase } from "../application/use-cases/submit-project-edit-request.js";
import { ReviewProjectEditRequestUseCase } from "../application/use-cases/review-project-edit-request.js";
import type { ListPendingProjectEditRequests } from "../application/ports/in/list-pending-project-edit-requests.js";
import { ListPendingProjectEditRequestsUseCase } from "../application/use-cases/list-pending-project-edit-requests.js";

/** Puertos de salida que necesitan los casos de uso. */
export interface Dependencias {
  users: UserRepository;
  companies: CompanyRepository;
  projects: ProjectRepository;
  auth: AuthProvider;
  ids: GeneradorDeIds;
  editRequests: ProjectEditRequestRepository;
}

/** Puertos de entrada que consume el adaptador HTTP. */
export interface CasosDeUso {
  registerCompany: RegisterCompany;
  logIn: LogIn;
  refreshUserSession: RefreshUserSession;
  logOut: LogOut;
  authenticate: Authenticate;
  uploadProject: UploadProject;
  listProjects: ListProjects;
  submitProjectEditRequest: SubmitProjectEditRequest;
  reviewProjectEditRequest: ReviewProjectEditRequest;
  listPendingProjectEditRequests: ListPendingProjectEditRequests;
}

export function crearDependencias(config: Config): Dependencias {
  const ids = new GeneradorDeIdsUuid();

  if (config.supabase === null) {
    const users = new InMemoryUserRepository();
    const projects = new InMemoryProjectRepository();
    // Projects se inicializa separado porque el edit request necesita el acceso
    return {
      ids,
      users,
      auth: new InMemoryAuthProvider(users, ids),
      companies: new InMemoryCompanyRepository(),
      projects,
      editRequests: new InMemoryProjectEditRequestRepository(projects),
    };
  }

  const { url, claveSecreta } = config.supabase;
  const supabase = crearClienteSupabase(url, claveSecreta);
  const projects = new SupabaseProjectRepository(supabase);
  const editRequests = new SupabaseProjectEditRequestRepository(supabase);
  return {
    ids,
    auth: new SupabaseAuthProvider(supabase, () =>
      crearClienteSupabase(url, claveSecreta),
    ),
    users: new SupabaseUserRepository(supabase),
    companies: new SupabaseCompanyRepository(supabase),
    projects,
    editRequests,
  };
}

export function crearCasosDeUso({
  companies,
  projects,
  editRequests,
  auth,
  ids,
}: Dependencias): CasosDeUso {
  return {
    registerCompany: new RegisterCompanyUseCase(auth, companies, ids),
    logIn: new LogInUseCase(auth),
    refreshUserSession: new RefreshUserSessionUseCase(auth),
    logOut: new LogOutUseCase(auth),
    authenticate: new AuthenticateUseCase(auth),
    uploadProject: new UploadProjectUseCase(companies, projects, ids),
    listProjects: new ListProjectsUseCase(companies, projects),
    submitProjectEditRequest: new SubmitProjectEditRequestUseCase(
      companies,
      projects,
      editRequests,
      ids,
    ),
    reviewProjectEditRequest: new ReviewProjectEditRequestUseCase(editRequests),
    listPendingProjectEditRequests: new ListPendingProjectEditRequestsUseCase(
      editRequests,
    ),
  };
}
