import { createContext } from "react";
import type { SessionUser } from "./authService";

export interface AuthState {
  user: SessionUser | null;
  // true mientras se comprueba si ya hay una sesión al abrir la app.
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
