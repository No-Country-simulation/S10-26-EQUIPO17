import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-base-100">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!user) return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
