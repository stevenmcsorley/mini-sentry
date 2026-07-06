/**
 * Skylark in-app documentation — what each page does, the core concepts, how to
 * send errors from any stack, and what the MCP agent can do (with example prompts).
 * Static content so a new user (or a returning one) can self-serve.
 */

const card = 'rounded-xl border border-slate-800/60 bg-slate-900/40 p-6'
const h2 = 'text-lg font-semibold text-white'
const term = 'text-slate-200 font-medium'

const CONCEPTS: Array<[string, string]> = [
  ['Project', 'A single app/service you monitor. Owns its errors and has a unique ingest token (its DSN).'],
  ['Ingest token', 'The secret in the ingest URL that authorises sending events for a project. Safe to embed in a browser build (send-only).'],
  ['Event', 'One captured occurrence — a thrown error, a message, a log line — with its stack, level, environment, release and tags.'],
  ['Error group (Issue)', 'Events with the same fingerprint rolled up into one issue, with a count and first/last-seen. This is what you triage.'],
  ['Fingerprint', 'The signature Skylark uses to decide two events are “the same problem” and belong in one group.'],
  ['Level', 'error / warning / info — the severity of an event.'],
  ['Environment', 'Where it happened: production, staging, development… Used to filter noise.'],
  ['Release', 'A version of your app (e.g. 1.2.3). Ties errors to a deploy; enables regression and crash-free tracking.'],
  ['Deployment', 'A record that a release went out to an environment — annotates charts and health.'],
  ['Session / release health', 'ok vs crashed app sessions, giving a crash-free % per release.'],
  ['Alert rule', 'Fires (email/webhook) when a group crosses a threshold in a time window.'],
  ['Workspace', 'Your tenant. Projects, members, tokens and integrations all live inside one workspace.'],
  ['API token', 'A workspace-scoped token for programmatic access — used by the MCP agent and CI.'],
  ['Integration', 'A connected issue tracker (GitHub / Ossicone) so a group can become a ticket.'],
  ['Tracking item', 'A declared monitor — “this is a place I instrumented to report errors.” The intent, shown next to what’s actually arriving.'],
]

const PAGES: Array<[string, string]> = [
  ['Overview', 'The project home. Shows “What we’re monitoring” (declared monitors vs data actually arriving), plus releases, deployments, health and the issue-triage table (resolve / ignore / assign / comment / create ticket).'],
  ['Explore (Logs)', 'The raw event stream with search and filters — dig into individual events, stacks and tags.'],
  ['Dashboards', 'Charts: error volume over time, top issues, trends and spikes.'],
  ['Releases', 'Create releases, upload source maps (for readable stacks), record deployments, and see release health.'],
  ['Alerts', 'Create and manage alert rules and their targets (email/webhook).'],
  ['Projects', 'Create a project and grab its ingest token. “Open” takes you into a project’s Overview.'],
  ['Integrations', 'Connect GitHub / Ossicone so error groups can be filed as issues/tickets.'],
  ['AI Agent (MCP)', 'Create API tokens and learn how to connect an AI agent that can triage and manage everything here.'],
]

const STACKS: Array<[string, string]> = [
  ['Browser / React', 'initSkylark + SkylarkErrorBoundary — see examples/react'],
  ['Vue (Vite)', 'client init in main.js — examples/vue-vite'],
  ['Angular', 'client init in main.ts — examples/angular'],
  ['Plain JS (CDN)', 'ESM or IIFE client, Axios interceptor — examples/js-client, examples/CDN'],
  ['Node (Express)', 'error-handling middleware — examples/node-express'],
  ['Next.js', 'API route + client init — examples/node-nextjs'],
  ['Python (FastAPI)', 'global exception handler — examples/python-fastapi'],
  ['Python (Flask)', 'global error handler — examples/python-flask'],
  ['Python (logging)', 'logging.Handler that forwards records — examples/python-logging'],
  ['Go (net/http)', 'minimal POST example — examples/go-nethttp'],
  ['.NET (ASP.NET Core)', 'minimal API global handler — examples/dotnet-aspnetcore'],
  ['PHP (Laravel)', 'exception handler — examples/php-laravel'],
  ['Ruby (Rails)', 'Rack middleware — examples/ruby-rails'],
  ['Ruby (Sinatra)', 'tiny reporting app — examples/ruby-sinatra'],
  ['Serverless (AWS)', 'Lambda wrapper — examples/serverless-aws'],
  ['Source maps', 'upload scripts for Vite & CRA/webpack — examples/sourcemaps'],
]

const AGENT_EXAMPLES: Array<[string, string[]]> = [
  ['Understand a project', ['“Give me an overview of the ossicone project.”', '“What are we tracking in ossicone, and is anything not sending data?”']],
  ['Triage', ['“Show unresolved issues in ossicone, worst first.”', '“Resolve issue 42 and comment why.”', '“Assign the top issue to Steven.”']],
  ['Investigate', ['“What’s the stack trace on the latest event in issue 12?”', '“Any spike in errors in the last 24h?”']],
  ['Declare monitoring', ['“Add tracking: backend 5xx exception filter in main.ts.”', '“Mark the test hook monitor as removed.”']],
  ['File tickets', ['“Open a GitHub issue for this error group.”', '“File an Ossicone bug for issue 7.”']],
  ['Set up', ['“Create a project called billing-api.”', '“Send a test event to it so I can see it works.”']],
]

export function HelpPage() {
  return (
    <div className="space-y-6" data-testid="help-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Help &amp; Docs</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Skylark is a self-hosted error-monitoring platform: your apps send errors here, Skylark groups them into
          issues you can triage, chart and turn into tickets — and an AI agent (via MCP) can drive all of it.
        </p>
      </div>

      {/* How it works */}
      <div className={card}>
        <h2 className={h2}>How it works</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-300">
          <li><span className={term}>1. Create a project</span> → get its ingest token.</li>
          <li><span className={term}>2. Instrument your app</span> with the token (pick your stack below). Errors POST to the ingest endpoint.</li>
          <li><span className={term}>3. Skylark groups them</span> into issues by fingerprint, with counts and trends.</li>
          <li><span className={term}>4. Triage</span> — resolve / ignore / assign / comment, set alerts, file tickets.</li>
          <li><span className={term}>5. Let the agent help</span> — connect the MCP and ask it to do any of the above.</li>
        </ol>
      </div>

      {/* Concepts */}
      <div className={card}>
        <h2 className={h2}>Core concepts</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {CONCEPTS.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <dt className={`text-sm ${term}`}>{t}</dt>
              <dd className="mt-1 text-xs text-slate-400">{d}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Pages */}
      <div className={card}>
        <h2 className={h2}>The pages</h2>
        <dl className="mt-3 space-y-3">
          {PAGES.map(([t, d]) => (
            <div key={t} className="border-l-2 border-emerald-600/50 pl-3">
              <dt className={`text-sm ${term}`}>{t}</dt>
              <dd className="text-xs text-slate-400">{d}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Sending errors */}
      <div className={card}>
        <h2 className={h2}>Sending errors from your app</h2>
        <p className="mt-1 text-sm text-slate-400">
          Every event is an authenticated POST to the project’s ingest endpoint:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{`POST /api/events/ingest/token/<INGEST_TOKEN>/
Content-Type: application/json

{ "message": "Something broke", "level": "error",
  "environment": "production", "release": "1.2.3",
  "stack": "…", "tags": [{"key":"area","value":"checkout"}] }`}</pre>
        <p className="mt-4 text-sm text-slate-300">Ready-made examples ship in the repo under <code className="text-slate-400">examples/</code>:</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {STACKS.map(([name, note]) => (
            <div key={name} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <div className={`text-sm ${term}`}>{name}</div>
              <div className="mt-0.5 text-xs text-slate-400">{note}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Upload source maps on a release to get readable stack frames. The browser SDK also ships as
          <code className="text-slate-400"> packages/mini-sentry-client</code> (aliased <code className="text-slate-400">skylark-client</code>).
        </p>
      </div>

      {/* The agent */}
      <div className={card}>
        <h2 className={h2}>The AI agent (MCP)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Skylark ships a Model Context Protocol server so an AI agent can operate it in plain language. See the
          <span className="text-slate-200"> AI Agent</span> page to create a token and connect Claude Code, Claude Desktop, or any MCP client.
          Things you can ask:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {AGENT_EXAMPLES.map(([group, prompts]) => (
            <div key={group} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
              <div className={`text-sm ${term}`}>{group}</div>
              <ul className="mt-1 space-y-1 text-xs text-slate-400">
                {prompts.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className={card}>
        <h2 className={h2}>Integrations</h2>
        <p className="mt-1 text-sm text-slate-400">
          Connect an issue tracker under <span className="text-slate-200">Integrations</span>, then use
          <span className="text-slate-200"> Create Issue</span> on any error group (or ask the agent). Built on an adapter
          pattern — GitHub and Ossicone today; adding Bitbucket/GitLab/Linear is a new adapter with no other changes.
        </p>
      </div>
    </div>
  )
}
