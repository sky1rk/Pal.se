export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string | null
  updated_at: string | null
}

export interface AuthMeResponse {
  user: Profile
}
