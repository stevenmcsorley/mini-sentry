# Skylark MCP server

Exposes the [Skylark](https://skylark.halfagiraf.com) error-monitoring platform to
AI agents (Claude Code, etc.) as MCP tools, so an agent can triage and manage
errors: list/create projects, browse and resolve/ignore/assign/comment on error
groups, inspect events, read trend stats, and send test events.

## Configuration

Environment variables:

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `SKYLARK_URL` | no | `https://skylark.halfagiraf.com` | Base URL of the Skylark instance |
| `SKYLARK_TOKEN` | preferred | — | A scoped API token (create via `POST /api/tokens/`). Workspace-bound; no password needed |
| `SKYLARK_EMAIL` | fallback | — | Account email (used only if `SKYLARK_TOKEN` is unset) |
| `SKYLARK_PASSWORD` | fallback | — | Account password (obtains a JWT; refreshed on 401) |
| `SKYLARK_WORKSPACE_ID` | no | token's workspace / first | Pin the connection to a specific workspace (ignored when a token is set — the token is already bound) |

Provide **either** `SKYLARK_TOKEN` (recommended) **or** `SKYLARK_EMAIL` + `SKYLARK_PASSWORD`.

## Register with Claude Code (user scope)

```bash
claude mcp add skylark --scope user \
  -e SKYLARK_URL=https://skylark.halfagiraf.com \
  -e SKYLARK_EMAIL=you@example.com \
  -e SKYLARK_PASSWORD=your-password \
  -- node /absolute/path/to/mini-sentry/mcp/index.js
```

## Tools

- **Workspace**: `get_workspace`, `list_workspaces`
- **Projects**: `list_projects`, `create_project`
- **Error groups (issues)**: `list_issues`, `get_issue`, `resolve_issue`,
  `unresolve_issue`, `ignore_issue`, `assign_issue`, `comment_issue`, `list_comments`
- **Events**: `list_events`, `get_event`
- **Stats**: `top_issues`, `event_series`
- **Releases & alerts**: `list_releases`, `list_alert_rules`
- **Testing**: `send_test_event` (posts to a project's ingest token)

All tools except `send_test_event` require auth and are scoped to the connection's
workspace. `send_test_event` uses the project's public ingest token.

Requires Node ≥ 20. `npm install` then `npm start` (or register as above).
