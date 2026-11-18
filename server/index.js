import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { COURTS, HOURLY_RATE, MAX_PLAYERS, SLOTS } from '../src/slots.js'

const distDir = fileURLToPath(new URL('../dist/', import.meta.url))
const distRoot = distDir.endsWith(sep) ? distDir : `${distDir}${sep}`
const port = Number(process.env.PORT) || 3001
const host = process.env.HOST || '0.0.0.0'

const dbPath = new URL('../data/club.db', import.meta.url)
mkdirSync(new URL('../data/', import.meta.url), { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    plan TEXT NOT NULL,
    start_date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    court TEXT NOT NULL,
    play_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    hourly_rate INTEGER NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id)
  );
`)

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function siteFile(pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const filePath = normalize(join(distRoot, relative))
  if (filePath !== distRoot.slice(0, -1) && !filePath.startsWith(distRoot)) return null
  return filePath
}

function serveFile(response, filePath) {
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
  })
  createReadStream(filePath).pipe(response)
}

function serveSite(response, pathname) {
  const filePath = siteFile(pathname)
  if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
    serveFile(response, filePath)
    return true
  }
  const indexPath = join(distDir, 'index.html')
  if (!existsSync(indexPath)) return false
  serveFile(response, indexPath)
  return true
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = ''
    request.on('data', (chunk) => {
      raw += chunk
    })
    request.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

function memberRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    plan: row.plan,
    startDate: row.start_date,
  }
}

function validSlot(start, end) {
  return SLOTS.some((slot) => slot.start === start && slot.end === end)
}

function availability(date, memberId) {
  const counts = db
    .prepare(
      `SELECT court, start_time, COUNT(*) AS taken
       FROM bookings WHERE play_date = ?
       GROUP BY court, start_time`,
    )
    .all(date)
  const mine = memberId
    ? db
        .prepare(
          `SELECT court, start_time FROM bookings
           WHERE play_date = ? AND member_id = ?`,
        )
        .all(date, memberId)
    : []

  return COURTS.flatMap((court) =>
    SLOTS.map((slot) => {
      const countRow = counts.find(
        (row) => row.court === court && row.start_time === slot.start,
      )
      const taken = countRow?.taken ?? 0
      return {
        court,
        start: slot.start,
        end: slot.end,
        open: MAX_PLAYERS - taken,
        bookedByMe: mine.some(
          (row) => row.court === court && row.start_time === slot.start,
        ),
      }
    }),
  )
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1')

  try {
    if (request.method === 'GET' && url.pathname === '/api/members') {
      const rows = db
        .prepare('SELECT * FROM members ORDER BY rowid DESC')
        .all()
      send(response, 200, { members: rows.map((row) => memberRow(row)) })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/members') {
      const body = await readBody(request)
      const fullName = String(body.fullName ?? '').trim()
      const email = String(body.email ?? '').trim()
      const phone = String(body.phone ?? '').trim()
      const password = String(body.password ?? '')
      const plan = String(body.plan ?? '')
      const startDate = String(body.startDate ?? '')

      if (!fullName || !email || !phone || !password || !startDate) {
        send(response, 400, {
          error: 'Fill in name, email, phone, password, and start date.',
        })
        return
      }

      const existing = db
        .prepare('SELECT id FROM members WHERE email = ?')
        .get(email)
      if (existing) {
        send(response, 409, {
          error: 'This email is already registered. Use a different email.',
        })
        return
      }

      const id = crypto.randomUUID()
      db.prepare(
        `INSERT INTO members
         (id, full_name, email, phone, password, plan, start_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, fullName, email, phone, password, plan, startDate)
      const saved = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
      send(response, 201, { member: memberRow(saved) })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(request)
      const email = String(body.email ?? '').trim()
      const password = String(body.password ?? '')
      const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email)
      if (!row) {
        send(response, 404, {
          error: 'No membership found for this email. Register first.',
        })
        return
      }
      if (row.password !== password) {
        send(response, 401, {
          error: 'The password does not match this membership.',
        })
        return
      }
      send(response, 200, { member: memberRow(row) })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/availability') {
      const date = url.searchParams.get('date') ?? ''
      const memberId = url.searchParams.get('memberId') ?? ''
      if (!date) {
        send(response, 400, { error: 'Choose a date.' })
        return
      }
      send(response, 200, { slots: availability(date, memberId) })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/bookings') {
      const memberId = url.searchParams.get('memberId') ?? ''
      const member = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId)
      if (!member) {
        send(response, 404, { error: 'No membership found for this account.' })
        return
      }
      const bookings = db
        .prepare(
          `SELECT id, court, play_date, start_time, end_time, hourly_rate
           FROM bookings
           WHERE member_id = ?
           ORDER BY play_date, start_time, court`,
        )
        .all(memberId)
        .map((row) => ({
          id: row.id,
          court: row.court,
          date: row.play_date,
          start: row.start_time,
          end: row.end_time,
          amountDue: row.hourly_rate * 2,
        }))
      send(response, 200, { bookings })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/bookings') {
      const body = await readBody(request)
      const memberId = String(body.memberId ?? '')
      const court = String(body.court ?? '')
      const date = String(body.date ?? '')
      const start = String(body.start ?? '')
      const end = String(body.end ?? '')

      const member = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId)
      if (!member) {
        send(response, 404, { error: 'No membership found for this account.' })
        return
      }
      if (!COURTS.includes(court) || !validSlot(start, end) || !date) {
        send(response, 400, { error: 'Choose a court, date, and time slot.' })
        return
      }

      const sameTime = db
        .prepare(
          `SELECT id FROM bookings
           WHERE member_id = ? AND play_date = ? AND start_time = ?`,
        )
        .get(memberId, date, start)
      if (sameTime) {
        send(response, 409, { error: 'You already have a court at this time.' })
        return
      }

      const taken = db
        .prepare(
          `SELECT COUNT(*) AS taken FROM bookings
           WHERE court = ? AND play_date = ? AND start_time = ?`,
        )
        .get(court, date, start).taken
      if (taken >= MAX_PLAYERS) {
        send(response, 409, {
          error: 'This slot is full. Pick another court or time.',
        })
        return
      }

      const id = crypto.randomUUID()
      db.prepare(
        `INSERT INTO bookings
         (id, member_id, court, play_date, start_time, end_time, hourly_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, memberId, court, date, start, end, HOURLY_RATE)
      send(response, 201, {
        booking: {
          id,
          court,
          date,
          start,
          end,
          hourlyRate: HOURLY_RATE,
          hours: 2,
          amountDue: HOURLY_RATE * 2,
          payment: 'on-premise',
        },
      })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/admin') {
      const date = url.searchParams.get('date') ?? ''
      const members = db
        .prepare('SELECT * FROM members ORDER BY rowid DESC')
        .all()
        .map((row) => memberRow(row))
      const schedule = db
        .prepare(
          `SELECT bookings.id, members.full_name, members.email, bookings.court,
                  bookings.play_date, bookings.start_time, bookings.end_time
           FROM bookings
           JOIN members ON members.id = bookings.member_id
           ORDER BY bookings.play_date, bookings.start_time, bookings.court`,
        )
        .all()
        .map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          court: row.court,
          date: row.play_date,
          start: row.start_time,
          end: row.end_time,
        }))
      send(response, 200, {
        members,
        schedule,
        slots: date ? availability(date, '') : [],
      })
      return
    }

    if (request.method === 'GET' && !url.pathname.startsWith('/api') && serveSite(response, url.pathname)) {
      return
    }

    send(response, 404, { error: 'Not found.' })
  } catch (error) {
    send(response, 500, { error: error.message || 'Server error.' })
  }
})

server.listen(port, host)
