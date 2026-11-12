import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AuthLoading } from "./RequireAuth";
import { useAuth } from "./useAuth";

export function RequireGuest({ children, submitting = false }: { children: ReactNode; submitting?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  // La página de origen debe completar su propia navegación después de iniciar sesión.
  if (user && !submitting) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
