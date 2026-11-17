import { useState } from 'react'
import Admin from './Admin.jsx'
import Booking from './Booking.jsx'
import Home from './Home.jsx'
import Register from './Register.jsx'
import SignIn from './SignIn.jsx'
import './App.css'

export default function App() {
  const [page, setPage] = useState('home')
  const [member, setMember] = useState(null)

  function openBooking(signedInMember) {
    setMember(signedInMember)
    setPage('booking')
  }

  if (page === 'register') return <Register onNavigate={setPage} />
  if (page === 'admin') return <Admin onNavigate={setPage} />
  if (page === 'sign-in') return <SignIn onNavigate={setPage} onSignedIn={openBooking} />
  if (page === 'booking' && member) return <Booking member={member} onNavigate={setPage} />
  return <Home onNavigate={setPage} />
}
