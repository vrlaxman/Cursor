import { useState } from 'react'
import './App.css'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  plan: 'Individual',
  startDate: '',
}

const PLANS = ['Individual', 'Family', 'Student']

function App() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const fullName = form.fullName.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!fullName || !email || !phone || !form.startDate) {
      setError('Fill in name, email, phone, and start date.')
      return
    }

    setMembers((current) => [
      {
        id: crypto.randomUUID(),
        fullName,
        email,
        phone,
        plan: form.plan,
        startDate: form.startDate,
      },
      ...current,
    ])
    setForm(EMPTY_FORM)
    setError('')
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Hello Claude World</p>
        <h1>Membership</h1>
        <p>Collect a member’s details and keep them in this session.</p>
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
        <button type="submit">Save member</button>
      </form>

      <section>
        <h2>Collected members</h2>
        {members.length === 0 ? (
          <p className="empty">No members yet.</p>
        ) : (
          <div className="member-grid" role="table" aria-label="Collected members">
            <div className="member-grid-row member-grid-head" role="row">
              <span role="columnheader">Name</span>
              <span role="columnheader">Email</span>
              <span role="columnheader">Phone</span>
              <span role="columnheader">Plan</span>
              <span role="columnheader">Start date</span>
            </div>
            {members.map((member) => (
              <div className="member-grid-row" role="row" key={member.id}>
                <span role="cell">{member.fullName}</span>
                <span role="cell">{member.email}</span>
                <span role="cell">{member.phone}</span>
                <span role="cell">{member.plan}</span>
                <span role="cell">{member.startDate}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
