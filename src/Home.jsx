import clubImage from './assets/lake-pickle-doubles.jpg'

export default function Home({ onNavigate }) {
  return (
    <main className="home">
      <section className="hero">
        <img
          className="club-image"
          src={clubImage}
          alt="Four players on the lakeside pickleball court"
        />
        <div className="hero-copy">
          <p className="eyebrow">Lakeside pickleball</p>
          <h1>Lake Pickle Club</h1>
          <p>Four courts by the water. Join, sign in, and reserve a time.</p>
        </div>
      </section>

      <ul className="highlights">
        <li>4 courts</li>
        <li>4 players a slot</li>
        <li>2-hour slots, $60 an hour</li>
      </ul>

      <div className="home-actions">
        <button type="button" className="home-card primary" onClick={() => onNavigate('register')}>
          <strong>Register</strong>
          <span>Start a membership</span>
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate('sign-in')}>
          <strong>Sign in</strong>
          <span>See open slots and schedule a court</span>
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate('admin')}>
          <strong>Admin</strong>
          <span>Review members and who is booked to play</span>
        </button>
      </div>
    </main>
  )
}
