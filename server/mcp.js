import { createInterface } from 'node:readline'
import { isSlotActive } from '../src/slots.js'

const API = 'http://127.0.0.1:3001'

const tools = [
  {
    name: 'list_members',
    description: 'List Desi Pickle Club members: name, email, phone, plan, and start date.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'court_availability',
    description: 'Show how many spots are open on each court for a date. Date is YYYY-MM-DD.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Play date in YYYY-MM-DD format.' },
      },
      required: ['date'],
      additionalProperties: false,
    },
  },
  {
    name: 'member_bookings',
    description: 'List bookings for a member email. Status is current, past, or all.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Member email address.' },
        status: { type: 'string', enum: ['current', 'past', 'all'], description: 'Which bookings to include.' },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
]

async function club(path) {
  let response
  try {
    response = await fetch(`${API}${path}`)
  } catch {
    throw new Error('The club API is not running. Start it with: node server/index.js')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Club API returned ${response.status}.`)
  return data
}

async function callTool(name, args) {
  if (name === 'list_members') {
    const data = await club('/api/members')
    return data.members
  }

  if (name === 'court_availability') {
    const date = String(args.date ?? '').trim()
    if (!date) throw new Error('Provide a date as YYYY-MM-DD.')
    const data = await club(`/api/availability?date=${encodeURIComponent(date)}`)
    return { date, slots: data.slots }
  }

  if (name === 'member_bookings') {
    const email = String(args.email ?? '').trim()
    const status = String(args.status ?? 'all')
    if (!email) throw new Error('Provide the member email.')
    const members = await club('/api/members')
    const member = members.members.find((item) => item.email.toLowerCase() === email.toLowerCase())
    if (!member) throw new Error('No membership found for this email.')
    const data = await club(`/api/bookings?memberId=${encodeURIComponent(member.id)}`)
    const bookings = data.bookings.filter((booking) => {
      if (status === 'current') return isSlotActive(booking.date, booking.end)
      if (status === 'past') return !isSlotActive(booking.date, booking.end)
      return true
    })
    return { member, status, bookings }
  }

  throw new Error(`Unknown tool: ${name}`)
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function result(id, value) {
  send({ jsonrpc: '2.0', id, result: value })
}

function failure(id, message) {
  send({ jsonrpc: '2.0', id, error: { code: -32603, message } })
}

async function handle(message) {
  if (!message || message.jsonrpc !== '2.0') return
  const { id, method, params } = message
  if (id === undefined) return

  if (method === 'initialize') {
    result(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'desi-pickle-club', version: '1.0.0' },
    })
    return
  }

  if (method === 'ping') {
    result(id, {})
    return
  }

  if (method === 'tools/list') {
    result(id, { tools })
    return
  }

  if (method === 'tools/call') {
    try {
      const value = await callTool(params?.name, params?.arguments ?? {})
      result(id, { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] })
    } catch (error) {
      result(id, { content: [{ type: 'text', text: error.message }], isError: true })
    }
    return
  }

  if (method === 'resources/list' || method === 'prompts/list') {
    result(id, method === 'resources/list' ? { resources: [] } : { prompts: [] })
    return
  }

  failure(id, `Method not found: ${method}`)
}

const input = createInterface({ input: process.stdin, terminal: false })
input.on('line', (line) => {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) return
  try {
    handle(JSON.parse(trimmed))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
  }
})
