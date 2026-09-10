import { createContext } from "react";

import type { LoginCredentials, SignupCredentials, User } from "../types/auth";

export interface AuthContextValue {
  readonly mode: "mock" | "jwt";
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (credentials: SignupCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
