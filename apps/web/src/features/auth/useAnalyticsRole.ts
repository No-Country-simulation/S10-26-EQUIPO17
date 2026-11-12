import { useAuth } from "./useAuth";

export function useAnalyticsRole(): "company" | "admin" | "guest" | "unknown" {
  const { user, loading } = useAuth();
  if (loading) return "unknown";
  if (!user) return "guest";
  return user.role ?? "unknown";
}
