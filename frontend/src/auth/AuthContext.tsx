import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authService, AUTH_MODE } from "../api/auth";
import type { LoginCredentials, SignupCredentials, User } from "../types/auth";
import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService
      .me()
      .then((session) => {
        if (active) setUser(session);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextUser = await authService.login(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const nextUser = await authService.signup(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      mode: AUTH_MODE,
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
