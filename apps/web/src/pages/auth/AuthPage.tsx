import { useState } from 'react'
import { Navigate } from 'react-router'
import { Music2 } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import styles from './AuthPage.module.css'

type Tab = 'login' | 'signup'

export function AuthPage() {
  const { user, signIn, signUp } = useAuthStore()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/library" replace />

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (tab === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp(email, password)
      if (err) {
        setError(err)
      } else {
        setSuccess('Check your email for a confirmation link.')
        setEmail('')
        setPassword('')
      }
    }

    setLoading(false)
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <Music2 size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <span className={styles.brandName}>MapleMusic</span>
          <span className={styles.tagline}>Your music, everywhere.</span>
        </div>

        <div className={styles.card}>
          <div className={styles.tabs}>
            <button
              className={[styles.tab, tab === 'login' ? styles.activeTab : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                handleTabChange('login')
              }}
            >
              Log in
            </button>
            <button
              className={[styles.tab, tab === 'signup' ? styles.activeTab : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                handleTabChange('signup')
              }}
            >
              Sign up
            </button>
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
          >
            {error && <div className={styles.globalError}>{error}</div>}
            {success && <div className={styles.successMsg}>{success}</div>}

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
              }}
              required
            />

            <Button type="submit" full loading={loading} className={styles.submitBtn}>
              {tab === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>
        </div>

        <div className={styles.footer}>
          By continuing you agree to our Terms &amp; Privacy Policy.
        </div>
      </div>
    </div>
  )
}
