// Upload sourcemaps from dist/assets to a release for the given project slug
// Usage:
//   PROJECT_SLUG=my-app RELEASE_VERSION=1.0.0 node upload_sourcemap.mjs
// Env:
//   BASE (default http://localhost:8000)

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.env.BASE || 'http://localhost:8000'
const PROJECT_SLUG = process.env.PROJECT_SLUG
const VERSION = process.env.RELEASE_VERSION || '1.0.0'
// Default to 'development' to match the example app's environment
const ENV = process.env.RELEASE_ENV || 'development'

if (!PROJECT_SLUG) {
  console.error('Set PROJECT_SLUG to your project slug (from UI)')
  process.exit(1)
}

async function getJson(url, opts) {
  const r = await fetch(url, opts)
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

async function postJson(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

const projects = await getJson(`${BASE}/api/projects/`)
const project = projects.find(p => p.slug === PROJECT_SLUG)
if (!project) throw new Error(`Project slug not found: ${PROJECT_SLUG}`)

async function findOrCreateRelease() {
  // Try to find an existing release for project/version/env
  const rels = await getJson(`${BASE}/api/releases/?project=${PROJECT_SLUG}`)
  const found = rels.find(r => r.version === VERSION && r.environment === ENV)
  if (found) return found
  // Create if not found
  return await postJson(`${BASE}/api/releases/`, { project: project.id, version: VERSION, environment: ENV })
}

const release = await findOrCreateRelease()
console.log('Using release:', release)

const assetsDir = join(process.cwd(), 'dist', 'assets')
const files = (await readdir(assetsDir)).filter(n => n.endsWith('.map'))
if (files.length === 0) {
  console.error(`No .map files found in ${assetsDir}. Run 'npm run build' first.`)
  process.exit(1)
}

for (const name of files) {
  const content = await readFile(join(assetsDir, name), 'utf8')
  const res = await postJson(`${BASE}/api/releases/${release.id}/artifacts/`, {
    release: release.id,
    name,
    content,
    content_type: 'application/json',
  })
  console.log('Uploaded', name, '→', res.id)
}

console.log('Done. Ingest an event with a stack from the React app, then click View on the event in the UI to see symbolicated frames.')
