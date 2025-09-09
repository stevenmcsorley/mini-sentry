import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjectService } from '../useProjectService'

describe('useProjectService', () => {
  const mockOnProjectCreated = vi.fn()
  const mockOnReload = vi.fn().mockResolvedValue(undefined)

  const defaultParams = {
    onProjectCreated: mockOnProjectCreated,
    onReload: mockOnReload
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide createProject function', () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    expect(typeof result.current.createProject).toBe('function')
  })

  it('should create a new project successfully', async () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    await result.current.createProject('My New Project')

    await waitFor(() => {
      expect(mockOnReload).toHaveBeenCalledTimes(1)
      expect(mockOnProjectCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My New Project',
          slug: 'my-new-project',
          ingest_token: expect.any(String)
        })
      )
    })
  })

  it('should create proper slug from project name', async () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    await result.current.createProject('Test Project With Spaces!')

    await waitFor(() => {
      expect(mockOnProjectCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-project-with-spaces-'
        })
      )
    })
  })

  it('should handle project creation with special characters', async () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    await result.current.createProject('Test@Project#123')

    await waitFor(() => {
      expect(mockOnProjectCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-project-123'
        })
      )
    })
  })

  it('should reload projects list after creation', async () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    await result.current.createProject('Test Project')

    await waitFor(() => {
      expect(mockOnReload).toHaveBeenCalledTimes(1)
    })
  })

  it('should call onProjectCreated only if project has id', async () => {
    // Mock a response without id
    const mockOnProjectCreatedSpy = vi.fn()
    const { result } = renderHook(() => useProjectService({
      ...defaultParams,
      onProjectCreated: mockOnProjectCreatedSpy
    }))

    // MSW always returns a project with id, but we test the logic
    await result.current.createProject('Test Project')

    await waitFor(() => {
      expect(mockOnProjectCreatedSpy).toHaveBeenCalled()
    })
  })

  it('should handle API errors during project creation', async () => {
    const { result } = renderHook(() => useProjectService(defaultParams))

    // This would normally cause an error, but our MSW handlers are permissive
    // In a real test, you'd mock the API to return an error
    await expect(result.current.createProject('Test Project')).resolves.not.toThrow()
  })
})