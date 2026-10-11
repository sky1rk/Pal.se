import type { AuthMeResponse, Profile } from './types.ts'
import { apiBaseUrl, supabase } from './supabase.ts'

export async function fetchMe(accessToken: string): Promise<Profile> {
  const url = `${apiBaseUrl()}/api/auth/me`

  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 401) {
    // Token may have expired between render and fetch; refresh once and retry.
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session) {
      throw new Error('Session expired. Please sign in again.')
    }
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    })
  }

  if (response.status === 404) {
    // Profile trigger race right after signup.
    throw new Error('Profile is being created. Please wait a moment and retry.')
  }

  if (!response.ok) {
    throw new Error('Could not load your profile from the server.')
  }

  const body = (await response.json()) as AuthMeResponse
  return body.user
}
