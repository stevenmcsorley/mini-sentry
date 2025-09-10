import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server for Node.js (tests)
export const server = setupServer(...handlers)

server.events.on('request:unhandled', (req) => {
  console.error(
    'Found an unhandled %s request to %s',
    req.method,
    req.url.href,
  )
})