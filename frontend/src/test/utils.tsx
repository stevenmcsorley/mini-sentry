import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function with providers if needed
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data helpers
export const mockProject = {
  id: 1,
  name: 'Test Project',
  slug: 'test-project',
  ingest_token: 'test-token-123'
}

export const mockProjects = [
  mockProject,
  { id: 2, name: 'Another Project', slug: 'another-project', ingest_token: 'test-token-456' }
]

export const mockEvent = {
  id: 1,
  message: 'Test error message',
  level: 'error',
  timestamp: '2023-01-01T12:00:00Z',
  stack: 'Error: Test\n  at test.js:1:1',
  release: 1,
  environment: 'production'
}

// Wait helper for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))