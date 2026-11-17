export const COURTS = ['Court 1', 'Court 2', 'Court 3', 'Court 4']

export const SLOTS = [
  { start: '9:00 AM', end: '11:00 AM' },
  { start: '11:00 AM', end: '1:00 PM' },
  { start: '1:00 PM', end: '3:00 PM' },
  { start: '3:00 PM', end: '5:00 PM' },
]

export const MAX_PLAYERS = 4
export const HOURLY_RATE = 60
export const SLOT_HOURS = 2

export function slotLabel(slot) {
  return `${slot.start} – ${slot.end}`
}

export function slotEndsAt(date, end) {
  const [year, month, day] = date.split('-').map(Number)
  const match = String(end).match(/(\d+):(\d+)\s*(AM|PM)/i)
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return new Date(year, month - 1, day, hours, minutes)
}

export function isSlotActive(date, end, now = new Date()) {
  return slotEndsAt(date, end) > now
}
