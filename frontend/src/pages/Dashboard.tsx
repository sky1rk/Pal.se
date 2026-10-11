import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.ts'
import { fetchMe } from '../lib/api.ts'
import type { Profile } from '../lib/types.ts'

export function Dashboard() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!session) {
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMe(session.access_token)
        if (mounted) {
          setProfile(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Something went wrong.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [session])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Dashboard</h1>
        <p className="auth-subtitle">
          Profile loaded from the database via the backend API
        </p>
        {loading && <p className="auth-status">Loading your profile…</p>}
        {error && (
          <div>
            <p className="auth-error" role="alert">
              {error}
            </p>
            <button
              className="auth-submit"
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        {profile && (
          <dl className="profile-list">
            <div>
              <dt>Name</dt>
              <dd>
                {profile.first_name} {profile.last_name}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>
                <code>{profile.id}</code>
              </dd>
            </div>
          </dl>
        )}
        <button className="auth-secondary" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}
