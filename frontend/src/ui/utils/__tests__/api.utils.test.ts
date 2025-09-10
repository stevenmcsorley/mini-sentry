import { api } from '../api.utils'

// Mock fetch globally
const mockFetch = vi.fn()

describe('api utility', () => {
  beforeAll(() => {
    // Mock fetch for these tests
    global.fetch = mockFetch
  })

  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('makes successful API calls and returns JSON', async () => {
    const mockResponse = { id: 1, name: 'test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      }
    } as any)

    const result = await api('/api/test')

    expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined)
    expect(result).toEqual(mockResponse)
  })

  it('passes through request options', async () => {
    const mockResponse = { success: true }
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      }
    } as any)

    const result = await api('/api/create', options)

    expect(mockFetch).toHaveBeenCalledWith('/api/create', options)
    expect(result).toEqual(mockResponse)
  })

  it('throws error for non-ok HTTP responses', async () => {
    const errorText = 'Not Found'
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue(errorText)
    } as any)

    await expect(api('/api/notfound')).rejects.toThrow('API Error 404: Not Found')
    expect(mockFetch).toHaveBeenCalledWith('/api/notfound', undefined)
  })

  it('throws error for non-JSON content type', async () => {
    const textResponse = '<html>Not JSON</html>'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockResolvedValue(textResponse),
      headers: {
        get: vi.fn().mockReturnValue('text/html')
      }
    } as any)

    await expect(api('/api/html')).rejects.toThrow('Expected JSON but got: <html>Not JSON</html>...')
  })

  it('throws error for missing content type', async () => {
    const textResponse = 'Plain text response'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockResolvedValue(textResponse),
      headers: {
        get: vi.fn().mockReturnValue(null)
      }
    } as any)

    await expect(api('/api/plain')).rejects.toThrow('Expected JSON but got: Plain text response...')
  })

  it('handles JSON content type with charset', async () => {
    const mockResponse = { data: 'test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
      headers: {
        get: vi.fn().mockReturnValue('application/json; charset=utf-8')
      }
    } as any)

    const result = await api('/api/charset')

    expect(result).toEqual(mockResponse)
  })

  it('truncates long error text in non-JSON response', async () => {
    const longText = 'a'.repeat(200) // 200 characters
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockResolvedValue(longText),
      headers: {
        get: vi.fn().mockReturnValue('text/plain')
      }
    } as any)

    await expect(api('/api/long')).rejects.toThrow('Expected JSON but got: ' + 'a'.repeat(100) + '...')
  })

  it('handles fetch network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(api('/api/network-error')).rejects.toThrow('Network error')
  })

  it('handles JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      }
    } as any)

    await expect(api('/api/invalid-json')).rejects.toThrow('Invalid JSON')
  })

  it('handles response.text() errors for non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: vi.fn().mockRejectedValue(new Error('Failed to read response'))
    } as any)

    await expect(api('/api/text-error')).rejects.toThrow('Failed to read response')
  })

  it('handles response.text() errors for non-JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockRejectedValue(new Error('Failed to read text')),
      headers: {
        get: vi.fn().mockReturnValue('text/plain')
      }
    } as any)

    await expect(api('/api/read-error')).rejects.toThrow('Failed to read text')
  })
})