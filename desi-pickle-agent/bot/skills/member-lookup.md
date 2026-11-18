---
description: Use when someone asks who is enrolled, which courts are open, or what a member has booked.
---

# Member lookup

Use the club tools. Do not invent members, courts, or bookings.

1. For enrolled members, call `list_members`. Report name, email, phone, plan, and start date.
2. For open courts, call `court_availability` with the date as `YYYY-MM-DD`. Report each court, time, and how many spots are open.
3. For one member's bookings, call `member_bookings` with their email. Use `status` `current`, `past`, or `all`. Say which bookings are current and which are past.
4. If the tool says the club API is not running, say that `node server/index.js` must be running in the Desi Pickle Club folder.
5. If no member matches the email, say no membership was found and do not guess another person.
