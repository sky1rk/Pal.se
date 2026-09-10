import { apiClient } from "./client";
import type {
  AuthUserEnvelope,
  LoginCredentials,
  SignupCredentials,
  User,
} from "../types/auth";

export const AUTH_MODE: "mock" | "jwt" =
  import.meta.env.VITE_AUTH_MODE === "jwt" ? "jwt" : "mock";

export interface AuthService {
  readonly mode: "mock" | "jwt";
  login(credentials: LoginCredentials): Promise<User>;
  signup(credentials: SignupCredentials): Promise<User>;
  me(): Promise<User | null>;
  logout(): Promise<void>;
}

// mock client values
const MOCK_USER_KEY = "palse.mock.user";
const MOCK_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readMockUser(): User | null {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

// WARN: NEVER USE OUTSIDE DEVELOPMENT
// mock adapter - accepts any credentials; sessions persist in localStorage only
const mockAuthService: AuthService = {
  mode: "mock",

  async login({ email }: LoginCredentials): Promise<User> {
    await delay(MOCK_LATENCY_MS);
    const existing = readMockUser();
    const user: User =
      existing && existing.email === email
        ? existing
        : {
          id: `mock-${Date.now()}`,
          email,
          name: email.split("@")[0] ?? email,
        };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    return user;
  },

  async signup({ email, name }: SignupCredentials): Promise<User> {
    await delay(MOCK_LATENCY_MS);
    const user: User = { id: `mock-${Date.now()}`, email, name };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    return user;
  },

  async me(): Promise<User | null> {
    await delay(MOCK_LATENCY_MS);
    return readMockUser();
  },

  async logout(): Promise<void> {
    await delay(MOCK_LATENCY_MS);
    localStorage.removeItem(MOCK_USER_KEY);
  },
};

const jwtAuthService: AuthService = {
  mode: "jwt",

  async login(credentials: LoginCredentials): Promise<User> {
    return apiClient<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }).then((envelope) => envelope.user);
  },

  async signup(credentials: SignupCredentials): Promise<User> {
    return apiClient<{ user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    }).then((envelope) => envelope.user);
  },

  me(): Promise<User | null> {
    return apiClient<AuthUserEnvelope>("/auth/me").then(
      (envelope) => envelope.user,
      (error: unknown) => {
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          (error as { status?: number }).status === 401
        ) {
          return null;
        }
        throw error;
      },
    );
  },

  async logout(): Promise<void> {
    try {
      await apiClient<unknown>("/auth/logout", { method: "POST" });
    } catch {
      // session cookies are cleared server-side; ignore transport errors
    }
  },
};

export const authService: AuthService =
  AUTH_MODE === "jwt" ? jwtAuthService : mockAuthService;
