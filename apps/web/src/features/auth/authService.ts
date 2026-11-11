import { apiClient, ApiError } from "../../shared/api/apiClient";

export interface SessionUser {
  id: string;
  email: string;
  role: "company" | null;
}

interface SessionResponse {
  user: SessionUser;
}

export async function logIn(email: string, password: string): Promise<SessionUser> {
  const { user } = await apiClient<SessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return user;
}

export async function logOut(): Promise<void> {
  await apiClient<void>("/auth/logout", { method: "POST" });
}

let pendingRefresh: Promise<SessionUser | null> | null = null;

// El refresh recupera la sesión y rota los tokens; las llamadas simultáneas comparten la petición.
export function refreshSession(): Promise<SessionUser | null> {
  pendingRefresh ??= apiClient<SessionResponse>("/auth/refresh", { method: "POST" })
    .then(({ user }) => user)
    .catch((error) => {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    })
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}
