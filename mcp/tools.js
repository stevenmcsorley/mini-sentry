/**
 * Shared Skylark MCP tool definitions.
 *
 * The same tools back two transports:
 *   - index.js  stdio, authed by a single env token (SKYLARK_TOKEN)
 *   - http.js   remote Streamable-HTTP, authed by a per-request Bearer credential
 *
 * So the tool bodies never see a token directly — they call an injected `api()`
 * that's already bound to the right base URL + token. makeApi()/buildServer()
 * wire that up for each transport.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * Build an `api(path, {method, body})` bound to a base URL + workspace API token.
 * Skylark authenticates API tokens with the DRF `Token <token>` scheme (the
 * `Bearer` scheme is only used for the stdio email/password JWT flow, which the
 * token-only transports don't use). `api.base` exposes the base URL for the one
 * tool (send_test_event) that hits the public ingest endpoint unauthenticated.
 */
export function makeApi(baseUrl, token) {
  const base = String(baseUrl || '').replace(/\/$/, '')
  const api = async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers: {
        Authorization: `Token ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!res.ok) {
      const msg = data?.detail || data?.message || `${res.status} ${res.statusText}`
      throw new Error(`Skylark API error on ${method} ${path}: ${msg}`)
    }
    return data
  }
  api.base = base
  return api
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

/** Register every Skylark tool on `server`, calling the injected `api`. */
export function registerTools(server, api) {
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

  server.registerTool(
    'estate_overview',
    { description: 'One-glance health of EVERY project in the workspace — unresolved counts, latest issue, last deploy, active monitors, and workspace totals. Start here to see the whole estate before drilling into one project with project_overview.' },
    run(async () => api('/estate/'))
  )

  server.registerTool(
    'project_overview',
    {
      description: 'Everything a project tracks in one manifest: its human-written description, ingest endpoint, stats (events/groups), what is actually sending data (environments, platforms, tag keys, levels — derived from recent events), releases, alert rules, configured issue-tracker integrations, and external-link count. Start here to understand a project without re-explaining it.',
      inputSchema: { project: z.string().describe('project slug') },
    },
    run(async ({ project }) => api(`/projects/${encodeURIComponent(project)}/overview/`))
  )

  server.registerTool(
    'describe_project',
    {
      description: "Set the project's description — the persistent \"what does this project track and why\" note shown to humans on the overview and to future agents here. Use it to record context so a later session isn't lost.",
      inputSchema: { project: z.string().describe('project slug'), description: z.string() },
    },
    run(async ({ project, description }) =>
      api(`/projects/${encodeURIComponent(project)}/overview/`, { method: 'PATCH', body: { description } })
    )
  )

  // ---------- Tracking inventory (declared monitors) ----------
  // The MCP declares "here's what I set up to track" so humans can see, approve,
  // and ask to add/update/remove monitors. Distinct from the events that flow in.

  server.registerTool(
    'list_tracking',
    {
      description: 'The declared monitoring inventory for a project — every place instrumented to report errors to Skylark (frontend handlers, backend filters, jobs, test hooks…), with status. This is the intent; compare against project_overview.sources to see what is actually arriving.',
      inputSchema: { project: z.string().describe('project slug') },
    },
    run(async ({ project }) => api(`/projects/${encodeURIComponent(project)}/tracking/`))
  )

  server.registerTool(
    'add_tracking',
    {
      description: "Declare a monitor you set up (or plan to). Record each instrumentation point so humans can see what's being monitored and course-correct. origin defaults to 'mcp'.",
      inputSchema: {
        project: z.string().describe('project slug'),
        source: z.enum(['frontend', 'backend', 'mobile', 'infra', 'job', 'test', 'other']),
        kind: z.string().describe('short name, e.g. "window.onerror" or "NestJS 5xx exception filter"'),
        detail: z.string().optional().describe('what it captures / why'),
        location: z.string().optional().describe('file path or endpoint'),
        status: z.enum(['active', 'planned', 'removed']).optional(),
      },
    },
    run(async ({ project, ...body }) =>
      api(`/projects/${encodeURIComponent(project)}/tracking/`, { method: 'POST', body: { origin: 'mcp', ...body } })
    )
  )

  server.registerTool(
    'update_tracking',
    {
      description: 'Update a declared monitor (e.g. mark it active/planned/removed, edit its detail or location).',
      inputSchema: {
        project: z.string().describe('project slug'),
        id: z.number(),
        source: z.enum(['frontend', 'backend', 'mobile', 'infra', 'job', 'test', 'other']).optional(),
        kind: z.string().optional(),
        detail: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(['active', 'planned', 'removed']).optional(),
      },
    },
    run(async ({ project, id, ...body }) =>
      api(`/projects/${encodeURIComponent(project)}/tracking/${id}/`, { method: 'PATCH', body })
    )
  )

  server.registerTool(
    'remove_tracking',
    {
      description: 'Delete a declared monitor from the inventory (use when the instrumentation is gone). To keep history instead, update_tracking status to "removed".',
      inputSchema: { project: z.string().describe('project slug'), id: z.number() },
    },
    run(async ({ project, id }) => {
      await api(`/projects/${encodeURIComponent(project)}/tracking/${id}/`, { method: 'DELETE' })
      return { removed: id }
    })
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
      const res = await fetch(`${api.base}/api/events/ingest/token/${token}/`, {
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

  return server
}

/** Fresh McpServer with all tools registered against a bound `api`. */
export function buildServer(api) {
  const server = new McpServer({ name: 'skylark', version: '0.2.0' })
  registerTools(server, api)
  return server
}
