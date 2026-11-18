import { useState } from 'react'
import { api } from './api.js'
import clubImage from './assets/lake-pickle-club.jpg'

export default function SignIn({ onNavigate, onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const data = await api('/api/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      })
      setError('')
      onSignedIn(data.member)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="sign-in-page" style={{ backgroundImage: `url(${clubImage})` }}>
      <div className="sign-in-panel">
        <button type="button" className="text-link light" onClick={() => onNavigate('home')}>
          Home
        </button>
        <p className="eyebrow">Desi Pickle Club</p>
        <h1>Sign in</h1>
        <p>Use the email and password from your membership to book a court.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              autoComplete="email"
              aria-invalid={Boolean(error)}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit">Sign in</button>
        </form>
      </div>
    </main>
  )
}
