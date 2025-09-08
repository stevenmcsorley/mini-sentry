// upload_sourcemap.mjs
// Usage:
//   PROJECT_SLUG=test-cdn RELEASE_VERSION=demo-1.0.0 ENVIRONMENT=demo node upload_sourcemap.mjs
// Optional:
//   MS_API=http://localhost:8000 MAP_PATH=dist/error-storm.js.map MAP_NAME=error-storm.js.map

import fs from 'node:fs/promises';

const API      = process.env.MS_API || 'http://localhost:8000';
const PROJECT  = process.env.PROJECT_SLUG || 'test-cdn';
const VERSION  = process.env.RELEASE_VERSION || 'demo-1.0.0';
const ENV      = process.env.ENVIRONMENT || 'demo';
const MAP_PATH = process.env.MAP_PATH || 'dist/error-storm.js.map';
const MAP_NAME = process.env.MAP_NAME || 'error-storm.js.map';

async function j(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${opts.method || 'GET'} ${url} -> ${res.status} ${res.statusText}\n${text}`);
  }
  return res.json();
}

async function getOrCreateRelease() {
  const list = await j(`${API}/api/releases/?project=${PROJECT}`);
  const found = list.results?.find(
    r => r.version === VERSION && r.environment === ENV
  );
  if (found) return found;

  return j(`${API}/api/releases/`, {
    method: 'POST',
    body: JSON.stringify({
      project: PROJECT,
      version: VERSION,
      environment: ENV,
      notes: 'auto-created by upload_sourcemap.mjs',
    }),
  });
}

async function uploadMap(releaseId) {
  // Upload raw text of sourcemap (not parsed JSON)
  const mapText = await fs.readFile(MAP_PATH, 'utf8');
  const payload = {
    file_name: MAP_NAME,
    name: MAP_NAME,
    content_type: 'application/json',
    content: mapText, // must be string, not object
  };
  return j(`${API}/api/releases/${releaseId}/artifacts/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

(async () => {
  console.log(`Uploading ${MAP_PATH} → ${PROJECT} ${VERSION} (${ENV})`);

  const rel = await getOrCreateRelease();
  console.log(`Release id=${rel.id} version=${rel.version} env=${rel.environment}`);

  const art = await uploadMap(rel.id);
  console.log('Uploaded artifact:', art);

  const arts = await j(`${API}/api/releases/${rel.id}/artifacts/`);
  console.log('Artifacts now on release:', arts);
})().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
