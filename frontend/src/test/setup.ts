import { server } from '../mocks/server'
import { resetMockData } from '../mocks/handlers'
import { beforeAll, afterEach, afterAll } from 'vitest'

beforeAll(() => server.listen())

afterEach(() => {
  server.resetHandlers()
  resetMockData()
})

afterAll(() => server.close())
