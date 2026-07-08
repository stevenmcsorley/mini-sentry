#!/usr/bin/env node
/**
 * Skylark MCP server — stdio transport.
 *
 * For local clients that spawn the server as a subprocess (Claude Desktop/Code
 * with a filesystem path, or Clawx). Authed by a single workspace API token in
 * env. For a zero-install "just add a URL" connection, use the hosted HTTP
 * transport (http.js) at https://skylark.halfagiraf.com/mcp instead.
 *
 * Env:
 *   SKYLARK_URL    Base URL (default https://skylark.halfagiraf.com)
 *   SKYLARK_TOKEN  API token (workspace-bound) — required
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { makeApi, buildServer } from './tools.js'

const BASE_URL = (process.env.SKYLARK_URL || 'https://skylark.halfagiraf.com').replace(/\/$/, '')
const API_TOKEN = process.env.SKYLARK_TOKEN

if (!API_TOKEN) {
  console.error('SKYLARK_TOKEN is required (a workspace-bound API token)')
  process.exit(1)
}

const server = buildServer(makeApi(BASE_URL, API_TOKEN))
const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`Skylark MCP connected (${BASE_URL})`)
