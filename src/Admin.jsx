import { useEffect, useState } from 'react'
import { api } from './api.js'
import { isSlotActive } from './slots.js'

function ScheduleList({ players, empty }) {
  if (players.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="member-grid" role="table" aria-label="Scheduled players">
      <div className="member-grid-row booking-row member-grid-head" role="row">
        <span role="columnheader">Name</span>
        <span role="columnheader">Email</span>
        <span role="columnheader">Court</span>
        <span role="columnheader">Date</span>
        <span role="columnheader">Time</span>
      </div>
      {players.map((player) => (
        <div className="member-grid-row booking-row" role="row" key={player.id}>
          <span role="cell">{player.fullName}</span>
          <span role="cell">{player.email}</span>
          <span role="cell">{player.court}</span>
          <span role="cell">{player.date}</span>
          <span role="cell">{player.start} – {player.end}</span>
        </div>
      ))}
    </div>
  )
}

export default function Admin({ onNavigate }) {
  const [members, setMembers] = useState([])
  const [schedule, setSchedule] = useState([])
  const [error, setError] = useState('')
  const [scheduleTab, setScheduleTab] = useState('active')

  useEffect(() => {
    api('/api/admin')
      .then((data) => {
        setMembers(data.members)
        setSchedule(data.schedule)
        setError('')
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  return (
    <main>
      <header>
        <button type="button" className="text-link" onClick={() => onNavigate('home')}>
          Home
        </button>
        <h1>Admin</h1>
        <p>Enrollment and who is scheduled to play.</p>
      </header>
      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Enrollment</h2>
        {members.length === 0 ? (
          <p className="empty">No members enrolled yet.</p>
        ) : (
          <div className="member-grid" role="table" aria-label="Enrolled members">
            <div className="member-grid-row enrolled-row member-grid-head" role="row">
              <span role="columnheader">Name</span>
              <span role="columnheader">Email</span>
              <span role="columnheader">Phone</span>
              <span role="columnheader">Plan</span>
              <span role="columnheader">Start date</span>
            </div>
            {members.map((member) => (
              <div className="member-grid-row enrolled-row" role="row" key={member.id}>
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

      <section>
        <h2>Scheduled to play</h2>
        <div className="tabs" role="tablist" aria-label="Schedule status">
          <button
            type="button"
            role="tab"
            aria-selected={scheduleTab === 'active'}
            className={scheduleTab === 'active' ? 'tab active' : 'tab'}
            onClick={() => setScheduleTab('active')}
          >
            Current
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scheduleTab === 'past'}
            className={scheduleTab === 'past' ? 'tab active' : 'tab'}
            onClick={() => setScheduleTab('past')}
          >
            Past
          </button>
        </div>
        <ScheduleList
          players={schedule.filter((player) =>
            scheduleTab === 'active'
              ? isSlotActive(player.date, player.end)
              : !isSlotActive(player.date, player.end),
          )}
          empty={
            scheduleTab === 'active'
              ? 'No current bookings.'
              : 'No past bookings.'
          }
        />
      </section>

    </main>
  )
}
