import { useEffect, useState } from 'react'
import { api } from './api.js'
import { COURTS, HOURLY_RATE, MAX_PLAYERS, SLOT_HOURS, SLOTS, isSlotActive, slotLabel } from './slots.js'

function today() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function BookingList({ bookings, empty }) {
  if (bookings.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="member-grid" role="table" aria-label="Your bookings">
      <div className="member-grid-row schedule-list-row member-grid-head" role="row">
        <span role="columnheader">Court</span>
        <span role="columnheader">Date</span>
        <span role="columnheader">Time</span>
        <span role="columnheader">Due</span>
      </div>
      {bookings.map((booking) => (
        <div className="member-grid-row schedule-list-row" role="row" key={booking.id}>
          <span role="cell">{booking.court}</span>
          <span role="cell">{booking.date}</span>
          <span role="cell">{booking.start} – {booking.end}</span>
          <span role="cell">${booking.amountDue} on-premise</span>
        </div>
      ))}
    </div>
  )
}

export default function Booking({ member, onNavigate }) {
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [pending, setPending] = useState(null)
  const [notice, setNotice] = useState('')
  const [bookingTab, setBookingTab] = useState('active')

  useEffect(() => {
    api(`/api/bookings?memberId=${member.id}`)
      .then((data) => setBookings(data.bookings))
      .catch((requestError) => setNotice(requestError.message))
  }, [member.id])

  useEffect(() => {
    api(`/api/availability?date=${date}&memberId=${member.id}`)
      .then((data) => setSlots(data.slots))
      .catch((requestError) => setNotice(requestError.message))
  }, [member.id, date])

  function chooseSlot(slot) {
    if (slot.open === 0 || slot.bookedByMe) return
    setNotice('')
    setPending(slot)
  }

  async function confirmBooking() {
    try {
      const data = await api('/api/bookings', {
        method: 'POST',
        body: {
          memberId: member.id,
          court: pending.court,
          date,
          start: pending.start,
          end: pending.end,
        },
      })
      setPending(null)
      setNotice(
        `Booked ${data.booking.court} on ${data.booking.date}, ${data.booking.start} – ${data.booking.end}. Pay $${data.booking.amountDue} on-premise.`,
      )
      const [refreshed, mine] = await Promise.all([
        api(`/api/availability?date=${date}&memberId=${member.id}`),
        api(`/api/bookings?memberId=${member.id}`),
      ])
      setSlots(refreshed.slots)
      setBookings(mine.bookings)
    } catch (requestError) {
      setNotice(requestError.message)
    }
  }

  return (
    <main>
      <header>
        <button type="button" className="text-link" onClick={() => onNavigate('home')}>
          Back to home
        </button>
        <h1>Book a court</h1>
        <p>
          Welcome, {member.fullName}. {member.plan} plan, started {member.startDate}.
        </p>
      </header>

      <section>
        <h2>Your bookings</h2>
        <div className="tabs" role="tablist" aria-label="Booking status">
          <button
            type="button"
            role="tab"
            aria-selected={bookingTab === 'active'}
            className={bookingTab === 'active' ? 'tab active' : 'tab'}
            onClick={() => setBookingTab('active')}
          >
            Current
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bookingTab === 'past'}
            className={bookingTab === 'past' ? 'tab active' : 'tab'}
            onClick={() => setBookingTab('past')}
          >
            Past
          </button>
        </div>
        <BookingList
          bookings={bookings.filter((booking) =>
            bookingTab === 'active'
              ? isSlotActive(booking.date, booking.end)
              : !isSlotActive(booking.date, booking.end),
          )}
          empty={
            bookingTab === 'active'
              ? 'No current bookings. Choose a date and slot below.'
              : 'No past bookings.'
          }
        />
      </section>

      <section>
        <label>
          Date
          <input
            type="date"
            value={date}
            min={today()}
            onChange={(event) => {
              setDate(event.target.value)
              setPending(null)
            }}
          />
        </label>
        <h2>Available slots</h2>
        <p className="empty">
          Four courts. Each slot is {SLOT_HOURS} hours and holds {MAX_PLAYERS} players.
          The rate is ${HOURLY_RATE} an hour, paid on-premise.
        </p>
        {notice ? <p className="notice">{notice}</p> : null}
        <div className="schedule" role="table" aria-label="Court schedule">
          <div className="schedule-row schedule-head" role="row">
            <span role="columnheader">Time</span>
            {COURTS.map((court) => (
              <span role="columnheader" key={court}>
                {court}
              </span>
            ))}
          </div>
          {SLOTS.map((slot) => (
            <div className="schedule-row" role="row" key={slot.start}>
              <span role="rowheader">{slotLabel(slot)}</span>
              {COURTS.map((court) => {
                const cell = slots.find(
                  (item) => item.court === court && item.start === slot.start,
                ) ?? { court, start: slot.start, end: slot.end, open: MAX_PLAYERS, bookedByMe: false }
                return (
                  <div className="slot" role="cell" key={court}>
                    <span>{cell.open === 0 ? 'Full' : `${cell.open} of ${MAX_PLAYERS} open`}</span>
                    {cell.bookedByMe ? <span className="booked">Scheduled</span> : null}
                    <button
                      type="button"
                      disabled={cell.open === 0 || cell.bookedByMe}
                      onClick={() => chooseSlot(cell)}
                    >
                      Select
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {pending ? (
          <div className="confirm">
            <h2>Confirm this slot</h2>
            <p>
              {pending.court} on {date}, {pending.start} – {pending.end}.
            </p>
            <p>Hourly rate ${HOURLY_RATE}. {SLOT_HOURS} hours, ${HOURLY_RATE * SLOT_HOURS} due.</p>
            <p>Payment is collected on-premise.</p>
            <div className="actions">
              <button type="button" onClick={confirmBooking}>
                Confirm booking
              </button>
              <button type="button" className="secondary" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
