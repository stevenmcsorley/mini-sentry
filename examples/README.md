Examples

Python quick start

- Requirements: `pip install requests`
- Set your token (from UI root page): `export MS_TOKEN=<project_token>`

Send an event

```bash
python examples/python/send_event.py
# Optional overrides:
# MS_BASE=http://localhost:8000 MS_MESSAGE="Oops" MS_RELEASE=1.2.3 MS_ENV=staging python examples/python/send_event.py
```

Send a session (health)

```bash
python examples/python/send_session.py
# Optional overrides: MS_STATUS=crashed MS_USER=u1
```

Then browse the UI (http://localhost:5173) to see groups, events, and release health update.

React example

1) Set up

```bash
cd examples/react
cp .env.example .env.local
# edit .env.local and set VITE_MS_TOKEN to your project token (from UI)
npm install
```

2) Run the dev server (proxied to backend)

```bash
npm run dev
# open http://localhost:5174
```

The React Test Lab now exercises all features:

- Events: throw error (with stack), send message, send warning, spam multiple errors (to trigger alerts)
- Sessions: send ok/crashed sessions (health + crash‑free %)
- Releases & Artifacts: create a release, upload a sample function_map artifact
- Alerts: create an alert rule, snooze/unsnooze the latest group
- Deployments: create a deployment record
- ClickHouse: query recent events, get health time‑series (CH backend)

Open the Mini Sentry UI (http://localhost:5173) and refresh Groups/Events/Health to see data appear. Use “View” on events to inspect stacks (symbolicated after sourcemap upload + preview build).

3) Build and upload sourcemaps (for readable stacks)

```bash
npm run build
# The example app sends environment "development" by default.
# The upload script now defaults to RELEASE_ENV=development as well.
# Set PROJECT_SLUG to your slug (e.g., my-app) and VERSION to what your app sends.
PROJECT_SLUG=<your-project-slug> RELEASE_VERSION=1.0.0 node upload_sourcemap.mjs
# If needed, override the environment:
# PROJECT_SLUG=<slug> RELEASE_VERSION=1.0.0 RELEASE_ENV=production node upload_sourcemap.mjs
```

After uploading, trigger the error again and click “View” on the event to see symbolicated stack frames.
