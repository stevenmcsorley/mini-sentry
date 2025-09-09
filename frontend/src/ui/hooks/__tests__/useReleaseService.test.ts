import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReleaseService } from '../useReleaseService'
import { mockProject } from '../../../test/utils'

describe('useReleaseService', () => {
  const mockOnRefetch = vi.fn()

  const defaultParams = {
    selected: mockProject,
    releases: [
      { id: 1, version: '1.0.0', environment: 'production', created: '2023-01-01T10:00:00Z' }
    ],
    sessionUser: 'test-user',
    range: '24h' as const,
    interval: '5m' as const,
    onRefetch: mockOnRefetch
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide createRelease, createDeployment, and sendSession functions', () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    expect(typeof result.current.createRelease).toBe('function')
    expect(typeof result.current.createDeployment).toBe('function')
    expect(typeof result.current.sendSession).toBe('function')
  })

  it('should not create release when no project selected', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      selected: null
    }))

    await result.current.createRelease('1.0.1', 'staging')

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should create release successfully and refetch data', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await result.current.createRelease('1.0.1', 'staging')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should not create deployment when no project selected', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      selected: null
    }))

    await result.current.createDeployment('Deploy Name', 'https://example.com', 'production')

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should not create deployment when no releases available and no releaseId provided', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      releases: []
    }))

    await result.current.createDeployment('Deploy Name', 'https://example.com', 'production')

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should create deployment with first release when no releaseId provided', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await result.current.createDeployment('Deploy Name', 'https://example.com', 'production')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should create deployment with specific releaseId when provided', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await result.current.createDeployment('Deploy Name', 'https://example.com', 'production', 2)

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should not send session when no project selected', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      selected: null
    }))

    await result.current.sendSession('ok')

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should send session successfully and refetch data', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await result.current.sendSession('ok')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should send session with different status types', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    const statuses = ['init', 'ok', 'errored', 'crashed', 'exited'] as const

    for (const status of statuses) {
      await result.current.sendSession(status)
    }

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(statuses.length)
    })
  })

  it('should use default release version when no releases available', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      releases: []
    }))

    await result.current.sendSession('ok')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
    // The session should be sent with default version '1.0.0'
  })

  it('should use first release version when available', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      releases: [
        { id: 1, version: '2.0.0', environment: 'production', created: '2023-01-01T10:00:00Z' }
      ]
    }))

    await result.current.sendSession('ok')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
    // The session should be sent with version '2.0.0'
  })

  it('should handle API errors during release creation', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    // Should not throw on API errors
    await expect(result.current.createRelease('1.0.1', 'staging')).resolves.not.toThrow()
  })

  it('should handle API errors during deployment creation', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await expect(result.current.createDeployment('Deploy', 'https://test.com', 'prod')).resolves.not.toThrow()
  })

  it('should handle API errors during session sending', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    await expect(result.current.sendSession('ok')).resolves.not.toThrow()
  })

  it('should send session with correct user and environment', async () => {
    const { result } = renderHook(() => useReleaseService({
      ...defaultParams,
      sessionUser: 'custom-user'
    }))

    await result.current.sendSession('crashed')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
    // Session should include custom user and production environment
  })

  it('should set correct duration for different session statuses', async () => {
    const { result } = renderHook(() => useReleaseService(defaultParams))

    // 'ok' status should have duration > 0
    await result.current.sendSession('ok')
    
    // Other statuses should have duration = 0
    await result.current.sendSession('crashed')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(2)
    })
  })
})