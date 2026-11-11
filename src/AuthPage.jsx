import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'

const copy = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: 'Good to have you back.',
    description: 'Sign in to find your e-books and course links.',
    submit: 'Sign in',
  },
  signup: {
    eyebrow: 'YOUR NEXT CHAPTER',
    title: 'Make room to grow.',
    description: 'Create a student account to keep your books and courses together.',
    submit: 'Create account',
  },
  reset: {
    eyebrow: 'A FRESH START',
    title: 'Reset your password.',
    description: 'We’ll send you a link to choose a new password.',
    submit: 'Send reset link',
  },
  update: {
    eyebrow: 'ALMOST THERE',
    title: 'Choose a new password.',
    description: 'Make it one only you know.',
    submit: 'Update password',
  },
}

function AuthPage({ initialMode, onAuthenticated, onModeChange }) {
  const [mode, setMode] = useState(initialMode)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setMessage('')
    setError('')
  }, [initialMode])

  const changeMode = (nextMode) => {
    setMode(nextMode)
    onModeChange(nextMode)
    setMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    let result

    try {
      if (!supabase) {
        setError('Student accounts are not connected yet. Add your Supabase URL and publishable key to .env.local, then restart the app.')
        return
      }

      if (mode === 'signup') {
        const fullName = String(form.get('fullName') ?? '').trim()
        const confirmation = String(form.get('confirmPassword') ?? '')
        if (password !== confirmation) {
          setError('Those passwords don’t match.')
          return
        }
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        })
        if (!result.error && result.data.session) {
          onAuthenticated(result.data.session)
          return
        }
        if (!result.error) {
          setMessage('Check your inbox for a verification link to finish creating your account.')
          return
        }
      } else if (mode === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password })
        if (!result.error && result.data.session) {
          onAuthenticated(result.data.session)
          return
        }
        if (!result.error) {
          setError('No active session was returned. Check that you verified your email, then try again.')
          return
        }
      } else if (mode === 'reset') {
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (!result.error) {
          setMessage('If an account exists for that email, a password reset link is on its way.')
          return
        }
      } else {
        if (password !== String(form.get('confirmPassword') ?? '')) {
          setError('Those passwords don’t match.')
          return
        }
        result = await supabase.auth.updateUser({ password })
        if (!result.error) {
          changeMode('login')
          setMessage('Your password has been updated. Sign in with your new password.')
          return
        }
      }

      if (result?.error) setError(result.error.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setBusy(true)
    setMessage('')
    setError('')

    try {
      if (!supabase) {
        setError('Student accounts are not connected yet. Add your Supabase URL and publishable key to .env.local, then restart the app.')
        return
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (oauthError) setError(oauthError.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to continue with Google. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const content = copy[mode] ?? copy.login

  return (
    <main className="inner-page auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 id="auth-title">{content.title}</h1>
        <p className="auth-description">{content.description}</p>
        {!isSupabaseConfigured && (
          <p className="auth-notice" role="status">
            Set up Supabase to enable student accounts. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
          </p>
        )}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Full name
              <input name="fullName" type="text" autoComplete="name" minLength="2" maxLength="100" required />
            </label>
          )}
          {mode !== 'update' && (
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          {mode !== 'reset' && (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength="8"
                required
              />
            </label>
          )}
          {(mode === 'signup' || mode === 'update') && (
            <label>
              Confirm password
              <input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" required />
            </label>
          )}
          <button className="button button-dark auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : content.submit}
          </button>
        </form>
        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button className="auth-google-button" type="button" onClick={handleGoogleSignIn} disabled={busy}>
              <span className="google-mark" aria-hidden="true">G</span>
              Continue with Google
            </button>
          </>
        )}
        {mode === 'login' && (
          <button className="auth-text-button" type="button" onClick={() => changeMode('reset')}>Forgot your password?</button>
        )}
        {mode === 'login' && (
          <p className="auth-switch">New here? <button type="button" onClick={() => changeMode('signup')}>Create a student account</button></p>
        )}
        {mode === 'signup' && (
          <p className="auth-switch">Already have an account? <button type="button" onClick={() => changeMode('login')}>Sign in</button></p>
        )}
        {(mode === 'reset' || mode === 'update') && (
          <p className="auth-switch"><button type="button" onClick={() => changeMode('login')}>Back to sign in</button></p>
        )}
      </section>
    </main>
  )
}

export default AuthPage
