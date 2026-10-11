import { createClient } from '@supabase/supabase-js'

function requiredEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy frontend/.env.example to .env.local and fill it in.`,
    )
  }
  return value
}

const supabaseUrl = requiredEnv('VITE_SUPABASE_URL')
const supabasePublishableKey = requiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY')

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

export function apiBaseUrl(): string {
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    'http://localhost:8000'
  ).replace(/\/+$/, '')
}
