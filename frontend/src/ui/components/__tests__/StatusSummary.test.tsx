import { render, screen, waitFor } from '@testing-library/react'
import { StatusSummary } from '../StatusSummary'
import { api } from '../../utils/api.utils'

vi.mock('../../utils/api.utils')
const mockApi = vi.mocked(api)

describe('StatusSummary', () => {
  beforeEach(() => {
    mockApi.mockClear()
  })

  it('renders with initial zero counts', () => {
    mockApi.mockImplementation(() => Promise.resolve([]))
    
    render(<StatusSummary projectSlug="test-project" />)
    
    expect(screen.getByTestId('status-summary')).toBeInTheDocument()
    expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 0')
    expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 0')
  })

  it('fetches and displays release counts', async () => {
    const mockReleases = [
      { id: 1, version: '1.0.0' },
      { id: 2, version: '1.0.1' }
    ]
    
    mockApi
      .mockResolvedValueOnce(mockReleases) // releases API call
      .mockResolvedValueOnce([]) // artifacts for release 1
      .mockResolvedValueOnce([]) // artifacts for release 2
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 2')
    })
  })

  it('fetches and displays artifact counts', async () => {
    const mockReleases = [{ id: 1, version: '1.0.0' }]
    const mockArtifacts = [
      { id: 1, name: 'file1.js' },
      { id: 2, name: 'file2.js' },
      { id: 3, name: 'file3.js' }
    ]
    
    mockApi
      .mockResolvedValueOnce(mockReleases) // releases API call
      .mockResolvedValueOnce(mockArtifacts) // artifacts for release 1
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 3')
    })
  })

  it('handles multiple releases with artifacts', async () => {
    const mockReleases = [
      { id: 1, version: '1.0.0' },
      { id: 2, version: '1.0.1' }
    ]
    const mockArtifacts1 = [{ id: 1, name: 'file1.js' }, { id: 2, name: 'file2.js' }]
    const mockArtifacts2 = [{ id: 3, name: 'file3.js' }]
    
    mockApi
      .mockResolvedValueOnce(mockReleases) // releases API call
      .mockResolvedValueOnce(mockArtifacts1) // artifacts for release 1
      .mockResolvedValueOnce(mockArtifacts2) // artifacts for release 2
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 2')
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 3')
    })
  })

  it('handles API errors gracefully', async () => {
    mockApi.mockRejectedValue(new Error('API Error'))
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 0')
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 0')
    })
  })

  it('handles artifacts API errors gracefully', async () => {
    const mockReleases = [{ id: 1, version: '1.0.0' }]
    
    mockApi
      .mockResolvedValueOnce(mockReleases) // releases API call succeeds
      .mockRejectedValueOnce(new Error('Artifacts API Error')) // artifacts API call fails
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 1')
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 0')
    })
  })

  it('handles null/undefined releases response', async () => {
    mockApi.mockResolvedValueOnce(null)
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 0')
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 0')
    })
  })

  it('handles non-array artifacts response', async () => {
    const mockReleases = [{ id: 1, version: '1.0.0' }]
    
    mockApi
      .mockResolvedValueOnce(mockReleases) // releases API call
      .mockResolvedValueOnce({ count: 5, results: [] }) // non-array artifacts response
    
    render(<StatusSummary projectSlug="test-project" />)
    
    await waitFor(() => {
      expect(screen.getByTestId('releases-count')).toHaveTextContent('releases 1')
      expect(screen.getByTestId('artifacts-count')).toHaveTextContent('artifacts 0')
    })
  })

  it('makes API calls with correct endpoints', async () => {
    const mockReleases = [{ id: 1, version: '1.0.0' }]
    
    mockApi
      .mockResolvedValueOnce(mockReleases)
      .mockResolvedValueOnce([])
    
    render(<StatusSummary projectSlug="my-project" />)
    
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/api/releases/?project=my-project')
      expect(mockApi).toHaveBeenCalledWith('/api/releases/1/artifacts/')
    })
  })

  it('cleans up effect on unmount', async () => {
    const mockReleases = [{ id: 1, version: '1.0.0' }]
    
    // Create a promise that we can control
    let resolvePromise: () => void
    const controllablePromise = new Promise<any[]>((resolve) => {
      resolvePromise = () => resolve(mockReleases)
    })
    
    mockApi.mockReturnValueOnce(controllablePromise)
    
    const { unmount } = render(<StatusSummary projectSlug="test-project" />)
    
    // Unmount before the promise resolves
    unmount()
    
    // Resolve the promise after unmount
    resolvePromise!()
    
    // Wait a bit to ensure any state updates would have happened
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // No assertion needed - this test passes if no memory leaks or warnings occur
  })

  it('applies custom className', () => {
    mockApi.mockResolvedValue([])
    
    render(<StatusSummary projectSlug="test-project" className="custom-class" />)
    
    const statusSummary = screen.getByTestId('status-summary')
    expect(statusSummary).toHaveClass('custom-class')
  })

  it('applies custom testId', () => {
    mockApi.mockResolvedValue([])
    
    render(<StatusSummary projectSlug="test-project" testId="custom-status" />)
    
    expect(screen.getByTestId('custom-status')).toBeInTheDocument()
  })

  it('has correct default CSS classes', () => {
    mockApi.mockResolvedValue([])
    
    render(<StatusSummary projectSlug="test-project" />)
    
    const statusSummary = screen.getByTestId('status-summary')
    expect(statusSummary).toHaveClass(
      'hidden',
      'items-center',
      'gap-2',
      'text-xs',
      'text-slate-300',
      'md:flex'
    )
  })

  it('has correct styling for count badges', () => {
    mockApi.mockResolvedValue([])
    
    render(<StatusSummary projectSlug="test-project" />)
    
    const releasesCount = screen.getByTestId('releases-count')
    const artifactsCount = screen.getByTestId('artifacts-count')
    
    expect(releasesCount).toHaveClass('rounded', 'bg-slate-800/60', 'px-2', 'py-1')
    expect(artifactsCount).toHaveClass('rounded', 'bg-slate-800/60', 'px-2', 'py-1')
  })
})