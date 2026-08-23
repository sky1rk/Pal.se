// <reference types="vite/client" />

interface ImportMetaEnv {
  // base URL for API calls; defaults to /api
  readonly VITE_API_URL?: string;

  // mock (default) uses the localStorage adapter; jwt calls the real backend.
  readonly VITE_AUTH_MODE?: "mock" | "jwt";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
