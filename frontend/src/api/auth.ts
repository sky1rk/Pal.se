import { apiFetch } from "./client";
import type { LoginInput, SignupInput, User } from "../types/auth";

export async function signup(input: SignupInput): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function login(input: LoginInput): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function me(): Promise<User | null> {
  try {
    const data = await apiFetch<{ user: User | null }>("/api/auth/me");
    return data.user;
  } catch (err) {
    if (err instanceof Error && (err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  } catch {
    // Cookie may already be expired; treat as logged out.
  }
}
