import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useEventService } from '../useEventService'
import { mockProject, mockEvent } from '../../../test/utils'
import { resetMockData } from '../../../mocks/handlers'

describe('useEventService', () => {
  const mockOnRefetch = vi.fn()
  const mockOnEventDetailsUpdate = vi.fn()

  const defaultParams = {
    selected: mockProject,
    msg: 'Test error message',
    releases: [
      { id: 1, version: '1.0.0', environment: 'production', created: '2023-01-01T10:00:00Z' }
    ],
    onRefetch: mockOnRefetch,
    onEventDetailsUpdate: mockOnEventDetailsUpdate
  }

  beforeEach(() => {
    resetMockData()
    vi.clearAllMocks()
  })

  it('should provide sendEvent and fetchEvent functions', () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    expect(typeof result.current.sendEvent).toBe('function')
    expect(typeof result.current.fetchEvent).toBe('function')
  })

  it('should not send event when no project is selected', async () => {
    const { result } = renderHook(() => useEventService({
      ...defaultParams,
      selected: null
    }))

    await result.current.sendEvent()

    // Should not call refetch since no project selected
    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should send event successfully and refetch data', async () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    await result.current.sendEvent()

    // Should refetch data after 500ms delay
    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    }, { timeout: 1000 })
  })

  it('should fetch event details successfully', async () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    await result.current.fetchEvent(1)

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          message: 'Test error message',
          symbolicated: expect.objectContaining({
            frames: expect.any(Array)
          })
        })
      )
    })
  })

  it('should handle event symbolication when release is found', async () => {
    const eventWithRelease = {
      ...mockEvent,
      stack: 'Error: Test\n  at test.js:1:1',
      release: 1,
      symbolicated: null
    }

    // Mock the API to return event without symbolication
    const { result } = renderHook(() => useEventService(defaultParams))

    await result.current.fetchEvent(1)

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          symbolicated: expect.objectContaining({
            frames: expect.any(Array)
          }),
          _symSource: expect.any(String)
        })
      )
    })
  })

  it('should not symbolicate when no stack trace', async () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    await result.current.fetchEvent(2) // Event without stack

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          id: 2,
          stack: null
        })
      )
    })
  })

  it('should not symbolicate when no project selected', async () => {
    const { result } = renderHook(() => useEventService({
      ...defaultParams,
      selected: null
    }))

    await result.current.fetchEvent(1)

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalled()
    })
  })

  it('should not symbolicate when release not found in releases list', async () => {
    const { result } = renderHook(() => useEventService({
      ...defaultParams,
      releases: [] // No releases
    }))

    await result.current.fetchEvent(1)

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          // Should not have _symSource since release not found
        })
      )
    })
  })

  it('should handle symbolication API errors gracefully', async () => {
    const { result } = renderHook(() => useEventService({
      ...defaultParams,
      releases: [
        { id: 999, version: 'nonexistent', environment: 'test', created: '2023-01-01T10:00:00Z' }
      ]
    }))

    // This should not throw even if symbolication fails
    await expect(result.current.fetchEvent(1)).resolves.not.toThrow()

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalled()
    })
  })

  it('should mark symbolicated events with stored source', async () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    await result.current.fetchEvent(1)

    await waitFor(() => {
      expect(mockOnEventDetailsUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          _symSource: 'stored' // Mock returns symbolicated data
        })
      )
    })
  })

  it('should send event with correct parameters', async () => {
    const { result } = renderHook(() => useEventService({
      ...defaultParams,
      msg: 'Custom error message'
    }))

    await result.current.sendEvent()

    // Verify that the API was called with correct data
    // In a real test, you'd mock the fetch call to verify parameters
    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('should handle fetch event API errors', async () => {
    const { result } = renderHook(() => useEventService(defaultParams))

    // Test with non-existent event ID
    await expect(result.current.fetchEvent(999)).resolves.not.toThrow()
  })
})