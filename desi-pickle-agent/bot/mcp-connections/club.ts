import { defineConnection } from "@grok/agent-sdk/connections";

export default defineConnection({
  command: "node",
  args: ["server/mcp.js"],
  cwd: "..",
  advertiseTools: true,
  tools: ["list_members", "court_availability", "member_bookings"],
});
