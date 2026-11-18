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
          <h1>Desi Pickle Club</h1>
          <p>Four courts by the water. Join, sign in, and reserve a time.</p>
        </div>
      </section>

      <div className="home-actions">
        <button type="button" className="home-card primary" onClick={() => onNavigate('register')}>
          <strong>Register</strong>
          <span>Start a membership</span>
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate('sign-in')}>
          <strong>Sign in</strong>
          <span>See open slots and schedule a court</span>
        </button>
      </div>
    </main>
  )
}
