import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { logIn, refreshSession, type SessionUser } from "./authService";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    refreshSession()
      .then((session) => active && setUser(session))
      // Un fallo de red se trata como "sin sesión"; la guardia enviará al login.
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await logIn(email, password);
    setUser(session);
    return session;
  }, []);

  const value = useMemo(() => ({ user, loading, signIn }), [user, loading, signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
