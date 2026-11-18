import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { friendlyMessage } from './lib/messages.js'
import { isValidUsername } from './lib/profile.js'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function ProfilePage({ user, onSignOut }) {
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [avatarPath, setAvatarPath] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [email, setEmail] = useState(user.email ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const previewUrlRef = useRef('')

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      try {
        if (!supabase) throw new Error('Your profile is not connected yet. Please try again later.')
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username,gender,avatar_path')
          .eq('user_id', user.id)
          .maybeSingle()
        if (profileError) throw profileError

        if (!profile) {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id })
            .select('username,gender,avatar_path')
            .single()
          if (createError?.code === '23505') {
            const { data: existingProfile, error: reloadError } = await supabase
              .from('profiles')
              .select('username,gender,avatar_path')
              .eq('user_id', user.id)
              .maybeSingle()
            if (reloadError) throw reloadError
            profile = existingProfile
          } else {
            if (createError) throw createError
            profile = createdProfile
          }
        }
        if (!profile) throw new Error('We couldn’t create your profile. Please try again in a moment.')

        let signedAvatarUrl = ''
        let avatarWarning = ''
        if (profile.avatar_path) {
          const { data: signedAvatar, error: avatarError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(profile.avatar_path, 3600)
          if (avatarError) {
            avatarWarning = 'Your profile loaded, but we couldn’t load your profile photo. You can upload it again.'
          } else {
            signedAvatarUrl = signedAvatar.signedUrl
          }
        }
        if (!active) return
        setUsername(profile.username ?? '')
        setGender(profile.gender ?? '')
        setAvatarPath(profile.avatar_path ?? '')
        setAvatarUrl(signedAvatarUrl)
        if (avatarWarning) setError(avatarWarning)
      } catch (requestError) {
        if (active) setError(friendlyMessage(requestError, 'account'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => { active = false }
  }, [user.id])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const saveProfile = async (event) => {
    event.preventDefault()
    const normalizedUsername = username.trim().toLowerCase()
    if (!isValidUsername(normalizedUsername)) {
      setError('Choose a username with 3–24 letters, numbers, or underscores.')
      return
    }
    if (!supabase) {
      setError('Your profile is not connected yet. Please try again later.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      let nextAvatarPath = avatarPath
      let nextAvatarUrl = avatarUrl
      if (avatarFile) {
        const extension = avatarFile.type === 'image/png' ? 'png' : avatarFile.type === 'image/webp' ? 'webp' : 'jpg'
        nextAvatarPath = `${user.id}/avatar.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(nextAvatarPath, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (uploadError) throw uploadError
        const { data: signedAvatar, error: signedUrlError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(nextAvatarPath, 3600)
        if (signedUrlError) throw signedUrlError
        nextAvatarUrl = signedAvatar.signedUrl
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: normalizedUsername,
          gender,
          avatar_path: nextAvatarPath || null,
        })
        .eq('user_id', user.id)
      if (updateError) throw updateError

      setUsername(normalizedUsername)
      setAvatarPath(nextAvatarPath)
      setAvatarUrl(nextAvatarUrl)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
      setPreviewUrl('')
      setAvatarFile(null)
      setMessage('Your profile has been saved.')
    } catch (requestError) {
      setError(friendlyMessage(requestError, 'account'))
    } finally {
      setSaving(false)
    }
  }

  const changeEmail = async (event) => {
    event.preventDefault()
    const nextEmail = email.trim()
    if (!nextEmail || nextEmail.toLowerCase() === (user.email ?? '').toLowerCase()) {
      setEmailError('Enter a different email address to update your account.')
      return
    }
    if (!supabase) {
      setEmailError('Email settings are not connected yet. Please try again later.')
      return
    }

    setChangingEmail(true)
    setEmailError('')
    setEmailMessage('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email: nextEmail })
      if (updateError) throw updateError
      setEmailMessage('Check your inbox to confirm the new address. Your sign-in email changes after confirmation.')
    } catch (requestError) {
      setEmailError(friendlyMessage(requestError, 'account'))
    } finally {
      setChangingEmail(false)
    }
  }

  const selectAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setPreviewUrl('')
    if (!AVATAR_TYPES.has(file.type) || file.size > MAX_AVATAR_SIZE) {
      setAvatarFile(null)
      setError('Choose a JPG, PNG, or WebP image smaller than 5 MB.')
      event.target.value = ''
      return
    }
    previewUrlRef.current = URL.createObjectURL(file)
    setPreviewUrl(previewUrlRef.current)
    setAvatarFile(file)
  }

  return (
    <main className="profile-page">
      <header className="profile-page-heading">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Profile & settings</h1>
        <p>Make your Infinivium account yours.</p>
      </header>

      <section className="profile-card" aria-label="Profile settings">
        {error && <p className="profile-feedback profile-error" role="alert">{error}</p>}
        {message && <p className="profile-feedback profile-success" role="status">{message}</p>}
        {loading ? <p className="profile-loading" role="status">Loading your profile…</p> : (
          <form className="profile-form" onSubmit={saveProfile}>
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {(previewUrl || avatarUrl)
                  ? <img src={previewUrl || avatarUrl} alt="Your profile" />
                  : <span aria-hidden="true">{(username || user.email || 'I').slice(0, 1).toUpperCase()}</span>}
              </div>
              <label className="profile-upload">
                <span>Profile picture</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} />
                <small>JPG, PNG, or WebP · up to 5 MB</small>
              </label>
            </div>

            <label className="profile-field">
              <span>Username</span>
              <input
                autoComplete="username"
                maxLength={24}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your_username"
                required
              />
              <small>3–24 characters. Letters, numbers, and underscores.</small>
            </label>

            <label className="profile-field">
              <span>Gender <small>(optional)</small></span>
              <select value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </label>

            <button className="button button-dark profile-save" type="submit" disabled={saving}>
              {saving ? 'Saving profile…' : 'Save profile'}
            </button>
          </form>
        )}
      </section>

      <section className="profile-card profile-email-card" aria-labelledby="profile-email-heading">
        <div className="profile-section-heading">
          <p className="eyebrow">SIGN-IN DETAILS</p>
          <h2 id="profile-email-heading">Email address</h2>
          <p>Your current sign-in email is <strong>{user.email}</strong>.</p>
        </div>
        <form className="profile-form" onSubmit={changeEmail}>
          <label className="profile-field">
            <span>New email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          {emailError && <p className="profile-feedback profile-error" role="alert">{emailError}</p>}
          {emailMessage && <p className="profile-feedback profile-success" role="status">{emailMessage}</p>}
          <button className="button button-outline profile-save" type="submit" disabled={changingEmail}>
            {changingEmail ? 'Sending confirmation…' : 'Change email'}
          </button>
        </form>
      </section>

      <button className="profile-signout" onClick={onSignOut}>Sign out</button>
    </main>
  )
}

export default ProfilePage
