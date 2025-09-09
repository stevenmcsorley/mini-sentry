import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from '../mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock window.location
delete (window as any).location
window.location = {
  ...window.location,
  hash: '',
  search: '',
  pathname: '/',
  href: 'http://localhost:5173/',
  origin: 'http://localhost:5173',
}

// Mock history API
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
    pushState: vi.fn(),
  },
  writable: true,
})