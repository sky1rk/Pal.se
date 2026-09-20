import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as authApi from "../api/auth";
import type { AuthContextValue, LoginInput, SignupInput, User } from "../types/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((u) => {
        if (active) setUser(u);
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

  const login = useCallback(async (input: LoginInput) => {
    setUser(await authApi.login(input));
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    setUser(await authApi.signup(input));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
