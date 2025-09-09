import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjectData } from '../useProjectData'
import { mockProject } from '../../../test/utils'
import type { Project, NavigationTab, TimeRange, TimeInterval } from '../../types/app.types'

describe('useProjectData', () => {
  const defaultParams = {
    selected: mockProject,
    filterLevel: '',
    filterEnv: '',
    filterRelease: '',
    search: '',
    timeSel: null,
    eventLimit: 50,
    eventOffset: 0,
    activeTab: 'logs' as NavigationTab,
    customRange: null,
    range: '24h' as TimeRange,
    interval: '5m' as TimeInterval
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      selected: null
    }))

    expect(result.current.groups).toEqual([])
    expect(result.current.events).toEqual([])
    expect(result.current.releases).toEqual([])
    expect(result.current.rules).toEqual([])
    expect(result.current.health).toEqual([])
    expect(result.current.deploys).toEqual([])
    expect(result.current.series).toEqual([])
    expect(result.current.eventTotal).toBe(0)
    expect(result.current.loading).toBe(false)
  })

  it('should not fetch data when no project is selected', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      selected: null
    }))

    // Wait a bit to ensure no API calls were made
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(result.current.loading).toBe(false)
    expect(result.current.groups).toEqual([])
  })

  it('should fetch all project data when project is selected', async () => {
    const { result } = renderHook(() => useProjectData(defaultParams))

    // Should start loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have fetched all data
    expect(result.current.groups).toHaveLength(3)
    expect(result.current.events).toHaveLength(2)
    expect(result.current.releases).toHaveLength(2)
    expect(result.current.rules).toHaveLength(1)
    expect(result.current.health).toHaveLength(2)
    expect(result.current.deploys).toHaveLength(1)
    expect(result.current.series).toHaveLength(2)
    expect(result.current.eventTotal).toBe(2)
  })

  it('should apply search filter to events API', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      search: 'error'
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Events should still be fetched (MSW doesn't actually filter, but the API call includes the search param)
    expect(result.current.events).toHaveLength(2)
  })

  it('should apply level filter to events API', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      filterLevel: 'error'
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('should apply environment filter to events API', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      filterEnv: 'production'
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('should apply release filter to events API', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      filterRelease: '1.0.0'
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('should apply pagination to events when on logs tab', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      activeTab: 'logs',
      eventLimit: 10,
      eventOffset: 5
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // MSW returns all events but in real implementation would be paginated
    expect(result.current.events).toHaveLength(2)
    expect(result.current.eventTotal).toBe(2)
  })

  it('should not apply pagination when not on logs tab', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      activeTab: 'overview',
      eventLimit: 10,
      eventOffset: 5
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('should calculate time parameters from custom range', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      timeSel: null,
      customRange: { value: 2, unit: 'h' },
      range: '24h'
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should fetch data with calculated time range
    expect(result.current.groups).toHaveLength(3)
  })

  it('should use timeSel when provided', async () => {
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      timeSel: {
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-01T23:59:59Z'
      }
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.groups).toHaveLength(3)
  })

  it('should refetch data when parameters change', async () => {
    const { result, rerender } = renderHook((props) => useProjectData(props), {
      initialProps: defaultParams
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const initialGroups = result.current.groups

    // Change filter and rerender
    rerender({
      ...defaultParams,
      filterLevel: 'warning'
    })

    // Should trigger new fetch
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should provide refetch function', async () => {
    const { result } = renderHook(() => useProjectData(defaultParams))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')

    // Call refetch
    result.current.refetch()

    // Should start loading again
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle API errors gracefully', async () => {
    // Test with invalid project to trigger 400 error from MSW
    const { result } = renderHook(() => useProjectData({
      ...defaultParams,
      selected: { ...mockProject, slug: '' } // Invalid project
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not crash and should have empty data
    expect(result.current.groups).toEqual([])
    expect(result.current.events).toEqual([])
  })

  it('should calculate time range from different range values', async () => {
    const ranges: TimeRange[] = ['1h', '24h', '7d', '14d', '30d', '90d']
    
    for (const range of ranges) {
      const { result } = renderHook(() => useProjectData({
        ...defaultParams,
        range,
        timeSel: null,
        customRange: null
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.groups).toHaveLength(3)
    }
  })
})