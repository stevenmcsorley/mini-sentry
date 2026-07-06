#!/usr/bin/env node
/**
 * Skylark MCP server
 *
 * Exposes the Skylark error-monitoring platform (projects, error groups/issues,
 * events, dashboards, releases, alerts) as MCP tools so an AI agent can triage
 * and manage errors.
 *
 * Env:
 *   SKYLARK_URL           Base URL (default https://skylark.halfagiraf.com)
 *   SKYLARK_EMAIL         Login email — required
 *   SKYLARK_PASSWORD      Login password — required
 *   SKYLARK_WORKSPACE_ID  Optional workspace id (defaults to your first workspace)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = (process.env.SKYLARK_URL || 'https://skylark.halfagiraf.com').replace(/\/$/, '')
const API_TOKEN = process.env.SKYLARK_TOKEN
const EMAIL = process.env.SKYLARK_EMAIL
const PASSWORD = process.env.SKYLARK_PASSWORD
const WORKSPACE_ID = process.env.SKYLARK_WORKSPACE_ID

if (!API_TOKEN && (!EMAIL || !PASSWORD)) {
  console.error('Set SKYLARK_TOKEN (an API token), or SKYLARK_EMAIL + SKYLARK_PASSWORD')
  process.exit(1)
}

let accessToken = null

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Skylark login failed: ${res.status} ${res.statusText}`)
  accessToken = (await res.json()).access
  return accessToken
}

async function api(path, { method = 'GET', body, _retried = false } = {}) {
  // Prefer a scoped API token (workspace-bound); otherwise log in for a JWT.
  let authHeader
  if (API_TOKEN) {
    authHeader = `Token ${API_TOKEN}`
  } else {
    if (!accessToken) await login()
    authHeader = `Bearer ${accessToken}`
  }
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      Authorization: authHeader,
      ...(WORKSPACE_ID ? { 'X-Workspace-Id': WORKSPACE_ID } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && !_retried && !API_TOKEN) {
    accessToken = null
    return api(path, { method, body, _retried: true })
  }
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = data?.detail || data?.message || `${res.status} ${res.statusText}`
    throw new Error(`Skylark API error on ${method} ${path}: ${msg}`)
  }
  return data
}

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })
const fail = (error) => ({
  isError: true,
  content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
})
const run = (fn) => async (args) => {
  try { return ok(await fn(args)) } catch (error) { return fail(error) }
}

const slimGroup = (g) => ({
  id: g.id,
  title: g.title,
  level: g.level,
  status: g.status,
  count: g.count,
  first_seen: g.first_seen,
  last_seen: g.last_seen,
  assignee: g.assignee || null,
  is_bookmarked: g.is_bookmarked ?? false,
})

const server = new McpServer({ name: 'skylark', version: '0.1.0' })

// ---------- Workspace ----------

server.registerTool(
  'get_workspace',
  { description: 'The workspace this MCP connection operates in, with your role and members. All other tools are scoped to it.' },
  run(async () => {
    const [current, members] = await Promise.all([
      api('/workspaces/current/'),
      api('/workspaces/current/members/').catch(() => []),
    ])
    return { workspace: current, members }
  })
)

server.registerTool(
  'list_workspaces',
  { description: 'All workspaces you belong to (set SKYLARK_WORKSPACE_ID to scope this connection to one).' },
  run(async () => api('/workspaces/'))
)

// ---------- Projects ----------

server.registerTool(
  'list_projects',
  { description: 'List projects in the workspace (id, name, slug, ingest_token).' },
  run(async () => api('/projects/'))
)

server.registerTool(
  'create_project',
  {
    description: 'Create a project. Returns it with its ingest_token (the DSN to send errors to).',
    inputSchema: { name: z.string(), slug: z.string().describe('lowercase url-safe slug') },
  },
  run(async ({ name, slug }) => api('/projects/', { method: 'POST', body: { name, slug } }))
)

// ---------- Error groups (issues) ----------

server.registerTool(
  'list_issues',
  {
    description: 'List error groups (issues) for a project, most-recent first. Optionally filter by status.',
    inputSchema: {
      project: z.string().describe('project slug'),
      status: z.enum(['unresolved', 'resolved', 'ignored']).optional(),
    },
  },
  run(async ({ project, status }) => {
    const groups = await api(`/groups/?project=${encodeURIComponent(project)}`)
    const list = Array.isArray(groups) ? groups : (groups.results ?? [])
    return list.filter(g => !status || g.status === status).map(slimGroup)
  })
)

server.registerTool(
  'get_issue',
  { description: 'Full detail for one error group.', inputSchema: { id: z.number() } },
  run(async ({ id }) => api(`/groups/${id}/`))
)

for (const [tool, action, verb] of [
  ['resolve_issue', 'resolve', 'Resolve'],
  ['unresolve_issue', 'unresolve', 'Re-open'],
  ['ignore_issue', 'ignore', 'Ignore'],
]) {
  server.registerTool(
    tool,
    { description: `${verb} an error group.`, inputSchema: { id: z.number() } },
    run(async ({ id }) => api(`/groups/${id}/${action}/`, { method: 'POST' }))
  )
}

server.registerTool(
  'assign_issue',
  {
    description: 'Assign an error group to someone (free-text name/email).',
    inputSchema: { id: z.number(), assignee: z.string() },
  },
  run(async ({ id, assignee }) => api(`/groups/${id}/assign/`, { method: 'POST', body: { assignee } }))
)

server.registerTool(
  'comment_issue',
  {
    description: 'Add a comment to an error group.',
    inputSchema: { id: z.number(), author: z.string(), body: z.string() },
  },
  run(async ({ id, author, body }) => api(`/groups/${id}/comments/`, { method: 'POST', body: { author, body } }))
)

server.registerTool(
  'list_comments',
  { description: 'List comments on an error group.', inputSchema: { id: z.number() } },
  run(async ({ id }) => api(`/groups/${id}/comments/`))
)

// ---------- Events ----------

server.registerTool(
  'list_events',
  {
    description: 'List recent raw events for a project (optionally by level).',
    inputSchema: {
      project: z.string().describe('project slug'),
      level: z.enum(['error', 'warning', 'info']).optional(),
      limit: z.number().optional(),
    },
  },
  run(async ({ project, level, limit }) => {
    const q = new URLSearchParams({ project })
    if (level) q.set('level', level)
    if (limit) q.set('limit', String(limit))
    return api(`/events/?${q.toString()}`)
  })
)

server.registerTool(
  'get_event',
  { description: 'Full detail (payload, stack, tags) for one event.', inputSchema: { id: z.number() } },
  run(async ({ id }) => api(`/events/${id}/`))
)

// ---------- Dashboards / stats ----------

server.registerTool(
  'top_issues',
  {
    description: 'Top error groups by volume over a time range (e.g. 24h, 7d).',
    inputSchema: { project: z.string(), range: z.string().optional().describe('e.g. 24h, 7d'), limit: z.number().optional() },
  },
  run(async ({ project, range, limit }) => {
    const q = new URLSearchParams({ project, backend: 'pg' })
    if (range) q.set('range', range)
    if (limit) q.set('limit', String(limit))
    return api(`/dashboard/top-groups/?${q.toString()}`)
  })
)

server.registerTool(
  'event_series',
  {
    description: 'Error volume over time, bucketed by level (for trend/spike detection).',
    inputSchema: { project: z.string(), range: z.string().optional(), interval: z.string().optional().describe('e.g. 5m, 1h') },
  },
  run(async ({ project, range, interval }) => {
    const q = new URLSearchParams({ project, backend: 'pg' })
    if (range) q.set('range', range)
    if (interval) q.set('interval', interval)
    return api(`/dashboard/series/?${q.toString()}`)
  })
)

// ---------- Releases & alerts ----------

server.registerTool(
  'list_releases',
  { description: 'List releases for a project.', inputSchema: { project: z.string() } },
  run(async ({ project }) => api(`/releases/?project=${encodeURIComponent(project)}`))
)

server.registerTool(
  'list_alert_rules',
  { description: 'List alert rules for a project.', inputSchema: { project: z.string() } },
  run(async ({ project }) => api(`/alert-rules/?project=${encodeURIComponent(project)}`))
)

// ---------- Test ingest ----------

server.registerTool(
  'send_test_event',
  {
    description: 'Send a test event to a project via its ingest token (get the token from list_projects).',
    inputSchema: {
      token: z.string().describe('project ingest_token'),
      message: z.string(),
      level: z.enum(['error', 'warning', 'info']).optional(),
      environment: z.string().optional(),
    },
  },
  run(async ({ token, message, level, environment }) => {
    // Ingest is public (token-authenticated), so hit it directly without the JWT.
    const res = await fetch(`${BASE_URL}/api/events/ingest/token/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, level: level || 'error', environment: environment || 'production' }),
    })
    if (!res.ok) throw new Error(`ingest failed: ${res.status}`)
    return res.json()
  })
)

// ---------- Integrations (issue trackers) ----------

server.registerTool(
  'list_integrations',
  { description: 'Configured issue-tracker integrations for this workspace (GitHub / Ossicone) and the fields each adapter needs.' },
  run(async () => api('/integrations/'))
)

server.registerTool(
  'create_github_issue',
  {
    description: 'Open a GitHub issue from a Skylark error group (requires a configured github integration).',
    inputSchema: { group_id: z.number() },
  },
  run(async ({ group_id }) => api(`/groups/${group_id}/create-issue/`, { method: 'POST', body: { provider: 'github' } }))
)

server.registerTool(
  'create_ossicone_ticket',
  {
    description: 'File an Ossicone bug ticket from a Skylark error group (requires a configured ossicone integration).',
    inputSchema: { group_id: z.number() },
  },
  run(async ({ group_id }) => api(`/groups/${group_id}/create-issue/`, { method: 'POST', body: { provider: 'ossicone' } }))
)

server.registerTool(
  'list_issue_links',
  {
    description: 'External issues/tickets linked to a Skylark error group.',
    inputSchema: { group_id: z.number() },
  },
  run(async ({ group_id }) => api(`/groups/${group_id}/links/`))
)

const transport = new StdioServerTransport()
await server.connect(transport)
