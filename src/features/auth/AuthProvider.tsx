import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { onSessionExpired } from "../../lib/apiClient";
import * as authService from "./authService";
import { clearSession } from "./sessionStorage";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  signIn: (username: string, password: string, selectedRole: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await authService.restoreSession();
      setUser(session?.user || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kiểm tra phiên đăng nhập.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void retry(); }, [retry]);
  useEffect(() => onSessionExpired(() => { setUser(null); setError(null); }), []);

  const signIn = async (username: string, password: string, selectedRole: string) => {
    const session = await authService.login(username, password, selectedRole);
    setError(null);
    setUser(session.user);
  };

  const signOut = async () => {
    await clearSession();
    setUser(null);
    setError(null);
  };

  return <AuthContext.Provider value={{ user, loading, error, retry, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
