import { useState } from 'react'
import { api } from './api.js'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  plan: 'Individual',
  startDate: '',
}

const PLANS = ['Individual', 'Family', 'Student']

export default function Register({ onNavigate }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [thanks, setThanks] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setThanks('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const fullName = form.fullName.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    const password = form.password

    if (!fullName || !email || !phone || !password || !form.startDate) {
      setError('Fill in name, email, phone, password, and start date.')
      return
    }

    try {
      await api('/api/members', {
        method: 'POST',
        body: {
          fullName,
          email,
          phone,
          password,
          plan: form.plan,
          startDate: form.startDate,
        },
      })
      setForm(EMPTY_FORM)
      setError('')
      setThanks(fullName)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main>
      <header>
        <button type="button" className="text-link" onClick={() => onNavigate('home')}>
          Back to home
        </button>
        <h1>Register</h1>
        <p>Create a Lake Pickle Club membership.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="fullName"
            value={form.fullName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            aria-invalid={error.startsWith('This email')}
            required
          />
        </label>
        <label>
          Phone
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={updateField}
            autoComplete="tel"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Plan
          <select name="plan" value={form.plan} onChange={updateField}>
            {PLANS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={updateField}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Apply Membership</button>
      </form>

      {thanks ? (
        <section className="thanks">
          <h2>Thank you, {thanks}</h2>
          <p>
            Your membership application is saved. Sign in with your email and
            password to schedule a court.
          </p>
          <button type="button" onClick={() => onNavigate('sign-in')}>
            Sign in
          </button>
        </section>
      ) : null}
    </main>
  )
}
