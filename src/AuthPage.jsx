import { useEffect, useMemo, useState } from 'react'
import Notice from './components/Notice.jsx'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'
import { friendlyError } from './lib/messages.js'
import { evaluatePassword, getPasswordErrorMessage, PASSWORD_MIN_LENGTH, PASSWORD_RULES } from './lib/password.js'

const copy = {
  login: {
    eyebrow: 'WELCOME BACK',
    title: 'Good to have you back.',
    description: 'Sign in to find your e-books and course links.',
    submit: 'Sign in',
    busy: 'Signing you in…',
  },
  signup: {
    eyebrow: 'YOUR NEXT CHAPTER',
    title: 'Make room to grow.',
    description: 'Create a student account to keep your books and courses together.',
    submit: 'Create account',
    busy: 'Creating your account…',
  },
  reset: {
    eyebrow: 'A FRESH START',
    title: 'Reset your password.',
    description: 'We’ll send you a link to choose a new password.',
    submit: 'Send reset link',
    busy: 'Sending the link…',
  },
  update: {
    eyebrow: 'ALMOST THERE',
    title: 'Choose a new password.',
    description: 'Make it one only you know.',
    submit: 'Update password',
    busy: 'Updating your password…',
  },
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="m4 4 16 16" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

function PasswordInput({ id, name, label, value, onChange, autoComplete, visible, onToggle, describedBy, invalid }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          className="password-visibility"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  )
}

function PasswordGuidance({ result, password }) {
  if (!password) {
    return (
      <p className="password-hint">
        Use at least {PASSWORD_MIN_LENGTH} characters with an uppercase letter, a lowercase letter, a number, and a symbol.
      </p>
    )
  }

  return (
    <div className={`password-guidance password-${result.tone}`} aria-live="polite">
      <div className="password-strength-row">
        <span>Password strength</span>
        <strong>{result.label}</strong>
      </div>
      <div className="password-meter" aria-hidden="true">
        <span style={{ width: `${result.percent}%` }} />
      </div>
      <ul className="password-rules">
        {PASSWORD_RULES.map((rule) => {
          const met = result.checks[rule.key]
          return (
            <li key={rule.key} className={met ? 'met' : ''}>
              <span className="rule-mark" aria-hidden="true">{met ? '✓' : '·'}</span>
              {rule.label}
              <span className="visually-hidden">{met ? ' — met' : ' — not met yet'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AuthPage({ initialMode, onAuthenticated, onModeChange, onSignupSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const passwordCheck = useMemo(
    () => evaluatePassword(password, { email, name: fullName }),
    [password, email, fullName],
  )
  const passwordsMatch = password === confirmPassword
  const strengthMode = mode === 'signup' || mode === 'update'

  const clearFeedback = () => {
    setError(null)
    setMessage(null)
  }

  const resetPasswords = () => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setAttempted(false)
  }

  useEffect(() => {
    setMode(initialMode)
    clearFeedback()
    resetPasswords()
  }, [initialMode])

  const changeMode = (nextMode) => {
    setMode(nextMode)
    onModeChange(nextMode)
    clearFeedback()
    resetPasswords()
  }

  const showError = (title, text) => {
    setMessage(null)
    setError({ title, message: text })
  }

  const showSuccess = (title, text) => {
    setError(null)
    setMessage({ title, message: text })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    clearFeedback()
    setAttempted(true)

    const emailValue = email.trim()
    const fullNameValue = fullName.trim()

    try {
      if (!supabase) {
        showError(
          'Student accounts are taking a short break',
          'We’re putting the finishing touches on account access. You can keep browsing in the meantime — please check back shortly.',
        )
        return
      }

      if (strengthMode) {
        const check = evaluatePassword(password, { email: emailValue, name: fullNameValue })
        if (!check.valid) {
          showError('A little more strength, please', getPasswordErrorMessage(check))
          return
        }
        if (!passwordsMatch) {
          showError(
            'Those passwords don’t quite match',
            'Please retype both passwords so we know they’re the same — then you’re all set.',
          )
          return
        }
      }

      let result

      if (mode === 'signup') {
        result = await supabase.auth.signUp({
          email: emailValue,
          password,
          options: {
            data: { full_name: fullNameValue },
            emailRedirectTo: window.location.origin,
          },
        })
        if (!result.error && result.data.session) {
          onAuthenticated(result.data.session)
          return
        }
        if (!result.error) {
          if (onSignupSuccess) {
            onSignupSuccess(emailValue)
          } else {
            showSuccess('Account created', 'Check your inbox and verify your account before signing in.')
          }
          return
        }
      } else if (mode === 'login') {
        result = await supabase.auth.signInWithPassword({ email: emailValue, password })
        if (!result.error && result.data.session) {
          onAuthenticated(result.data.session)
          return
        }
        if (!result.error) {
          showError('One more step', 'Check your inbox for a verification link, then come back and sign in.')
          return
        }
      } else if (mode === 'reset') {
        result = await supabase.auth.resetPasswordForEmail(emailValue, {
          redirectTo: window.location.origin,
        })
        if (!result.error) {
          showSuccess(
            'Have a look in your inbox',
            'If an account exists for that email, a password reset link is on its way.',
          )
          return
        }
      } else {
        result = await supabase.auth.updateUser({ password })
        if (!result.error) {
          changeMode('login')
          showSuccess('Your password is updated', 'Sign in with your new password whenever you’re ready.')
          return
        }
      }

      if (result?.error) {
        const notice = friendlyError(
          result.error,
          mode === 'signup' ? 'signUp' : mode === 'login' ? 'signIn' : mode === 'reset' ? 'reset' : 'updatePassword',
        )
        showError(notice.title, notice.message)
      }
    } catch (requestError) {
      const notice = friendlyError(
        requestError,
        mode === 'signup' ? 'signUp' : mode === 'login' ? 'signIn' : mode === 'reset' ? 'reset' : 'updatePassword',
      )
      showError(notice.title, notice.message)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setBusy(true)
    clearFeedback()

    try {
      if (!supabase) {
        showError(
          'Student accounts are taking a short break',
          'We’re putting the finishing touches on account access. You can keep browsing in the meantime — please check back shortly.',
        )
        return
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (oauthError) {
        const notice = friendlyError(oauthError, 'signIn')
        showError(notice.title, notice.message)
      }
    } catch (requestError) {
      const notice = friendlyError(requestError, 'signIn')
      showError(notice.title, notice.message)
    } finally {
      setBusy(false)
    }
  }

  const content = copy[mode] ?? copy.login
  const guidanceId = strengthMode ? 'password-guidance' : undefined

  return (
    <main className="inner-page auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 id="auth-title">{content.title}</h1>
        <p className="auth-description">{content.description}</p>

        {!isSupabaseConfigured && (
          <Notice
            variant="warning"
            title="Student accounts are taking a short break"
            className="auth-config-notice"
          >
            We’re putting the finishing touches on account access. You can keep browsing the collection in the meantime — please check back shortly.
          </Notice>
        )}

        {error && (
          <Notice variant="error" title={error.title} onDismiss={() => setError(null)}>
            {error.message}
          </Notice>
        )}
        {message && (
          <Notice variant="success" title={message.title} onDismiss={() => setMessage(null)}>
            {message.message}
          </Notice>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Full name
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                minLength="2"
                maxLength="100"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          )}
          {mode !== 'update' && (
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          )}

          {mode !== 'reset' && (
            <PasswordInput
              id="auth-password"
              name="password"
              label="Password"
              value={password}
              onChange={(value) => {
                setPassword(value)
                if (error) setError(null)
              }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              describedBy={guidanceId}
              invalid={attempted && strengthMode && password.length > 0 && !passwordCheck.valid}
            />
          )}

          {strengthMode && (
            <div id="password-guidance">
              <PasswordGuidance result={passwordCheck} password={password} />
            </div>
          )}

          {strengthMode && (
            <PasswordInput
              id="auth-confirm-password"
              name="confirmPassword"
              label="Confirm password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value)
                if (error) setError(null)
              }}
              autoComplete="new-password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((visible) => !visible)}
              invalid={confirmPassword.length > 0 && !passwordsMatch}
            />
          )}

          {strengthMode && confirmPassword.length > 0 && !passwordsMatch && (
            <p className="password-match-note" role="status">Those passwords don’t match yet.</p>
          )}

          <button className="button button-dark auth-submit" type="submit" disabled={busy}>
            {busy ? content.busy : content.submit}
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
