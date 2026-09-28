export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = Array.isArray((body as { detail?: unknown })?.detail)
      ? ((body as { detail: Array<{ msg: string }> }).detail.map((d) => d.msg).join("; "))
      : ((body as { detail?: string })?.detail ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, detail);
  }
  return body as T;
}
