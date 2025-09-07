// Upload CRA build sourcemaps (build/static/js/*.map) to a Mini Sentry release
// Env:
//   PROJECT_SLUG (required)
//   RELEASE_VERSION (default 1.0.0)
//   RELEASE_ENV (default production)
//   BASE (default http://localhost:8000)
//   DIR (default build/static/js)

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.env.BASE || 'http://localhost:8000'
const PROJECT_SLUG = process.env.PROJECT_SLUG
const VERSION = process.env.RELEASE_VERSION || '1.0.0'
const ENV = process.env.RELEASE_ENV || 'production'
const DIR = process.env.DIR || 'build/static/js'

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
  const rels = await getJson(`${BASE}/api/releases/?project=${PROJECT_SLUG}`)
  const found = rels.find(r => r.version === VERSION && r.environment === ENV)
  if (found) return found
  return await postJson(`${BASE}/api/releases/`, { project: project.id, version: VERSION, environment: ENV })
}

const release = await findOrCreateRelease()
console.log('Using release:', release)

const files = (await readdir(DIR)).filter(n => n.endsWith('.map'))
if (files.length === 0) {
  console.error(`No .map files found in ${DIR}. Build your app first.`)
  process.exit(1)
}

for (const name of files) {
  const content = await readFile(join(DIR, name), 'utf8')
  const res = await postJson(`${BASE}/api/releases/${release.id}/artifacts/`, {
    release: release.id,
    name,
    content,
    content_type: 'application/json',
  })
  console.log('Uploaded', name, '→', res.id)
}

console.log('Done. Trigger an error from your built app; open UI and view stack.')

