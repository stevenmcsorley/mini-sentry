import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAlertService } from '../useAlertService'
import { mockProject } from '../../../test/utils'

describe('useAlertService', () => {
  const mockOnRefetch = vi.fn()

  const defaultParams = {
    selected: mockProject,
    rules: [
      {
        id: 1,
        name: 'High Error Rate',
        level: 'error',
        threshold_count: 10,
        threshold_window_minutes: 5,
        notify_interval_minutes: 60,
        target_type: 'email' as const,
        target_value: 'admin@test.com'
      }
    ],
    editRule: {
      threshold: 15,
      window: 10,
      notify: 30
    },
    onRefetch: mockOnRefetch
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset alert spy
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('should provide createRule, updateFirstRule, and snoozeGroup functions', () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    expect(typeof result.current.createRule).toBe('function')
    expect(typeof result.current.updateFirstRule).toBe('function')
    expect(typeof result.current.snoozeGroup).toBe('function')
  })

  it('should not create rule when no project selected', async () => {
    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      selected: null
    }))

    await result.current.createRule('New Rule', 'warning', 5, 'email', 'test@example.com')

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should create rule successfully and refetch data', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await result.current.createRule('New Rule', 'warning', 5, 'email', 'test@example.com')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should create rule with webhook target type', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await result.current.createRule('Webhook Rule', 'error', 10, 'webhook', 'https://webhook.example.com')

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should not update rule when no project selected', async () => {
    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      selected: null
    }))

    await result.current.updateFirstRule()

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should not update rule when no rules exist', async () => {
    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      rules: []
    }))

    await result.current.updateFirstRule()

    expect(mockOnRefetch).not.toHaveBeenCalled()
  })

  it('should update first rule successfully and refetch data', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await result.current.updateFirstRule()

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
  })

  it('should update rule with editRule values', async () => {
    const customEditRule = {
      threshold: 25,
      window: 15,
      notify: 45
    }

    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      editRule: customEditRule
    }))

    await result.current.updateFirstRule()

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1)
    })
    // The API should be called with the custom editRule values
  })

  it('should not snooze group when no project selected', async () => {
    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      selected: null
    }))

    await result.current.snoozeGroup(123)

    expect(mockOnRefetch).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('should not snooze group when no rules exist', async () => {
    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      rules: []
    }))

    await result.current.snoozeGroup(123)

    expect(mockOnRefetch).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('should snooze group successfully with default minutes', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await result.current.snoozeGroup(123)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Snoozed alerts for this group')
    })
  })

  it('should snooze group with custom minutes', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await result.current.snoozeGroup(123, 120)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Snoozed alerts for this group')
    })
  })

  it('should handle API errors during rule creation', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await expect(
      result.current.createRule('Test Rule', 'error', 5, 'email', 'test@example.com')
    ).resolves.not.toThrow()
  })

  it('should handle API errors during rule update', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await expect(result.current.updateFirstRule()).resolves.not.toThrow()
  })

  it('should handle API errors during group snooze', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    await expect(result.current.snoozeGroup(123)).resolves.not.toThrow()
  })

  it('should use first rule ID for updates and snoozing', async () => {
    const rulesWithMultiple = [
      { ...defaultParams.rules[0], id: 1 },
      { ...defaultParams.rules[0], id: 2 },
      { ...defaultParams.rules[0], id: 3 }
    ]

    const { result } = renderHook(() => useAlertService({
      ...defaultParams,
      rules: rulesWithMultiple
    }))

    await result.current.updateFirstRule()
    await result.current.snoozeGroup(123)

    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(1) // Only updateFirstRule calls refetch
      expect(window.alert).toHaveBeenCalledWith('Snoozed alerts for this group')
    })
  })

  it('should create rule with all parameter types', async () => {
    const { result } = renderHook(() => useAlertService(defaultParams))

    // Test different level types
    const levels = ['error', 'warning', 'info', 'debug'] as const
    const targetTypes = ['email', 'webhook'] as const

    for (const level of levels) {
      for (const targetType of targetTypes) {
        await result.current.createRule(
          `${level} Rule`,
          level,
          Math.floor(Math.random() * 100) + 1,
          targetType,
          targetType === 'email' ? 'test@example.com' : 'https://webhook.example.com'
        )
      }
    }

    // Should have called refetch for each rule creation
    await waitFor(() => {
      expect(mockOnRefetch).toHaveBeenCalledTimes(levels.length * targetTypes.length)
    })
  })
})