import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReleasesPage } from '../ReleasesPage'

// Mock data
const mockProject = {
  id: 1,
  name: 'Test Project',
  slug: 'test-project',
  ingest_token: 'test-token'
}

const mockReleases = [
  {
    id: 1,
    version: '1.0.0',
    environment: 'production',
    created_at: '2025-01-01T00:00:00Z',
    project: 1
  },
  {
    id: 2,
    version: '1.1.0',
    environment: 'staging',
    created_at: '2025-01-02T00:00:00Z',
    project: 1
  }
]

describe('ReleasesPage', () => {
  const mockOnReleaseCreated = vi.fn()

  beforeEach(() => {
    mockOnReleaseCreated.mockClear()
  })

  it('renders release management page', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    expect(screen.getByText('Release Management')).toBeInTheDocument()
    expect(screen.getByText('Manage application versions, upload source maps, and track deployments for')).toBeInTheDocument()
    expect(screen.getByText('test-project')).toBeInTheDocument()
    expect(screen.getByText('Create New Release')).toBeInTheDocument()
  })

  it('displays existing releases', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    expect(screen.getByText('1.0.0')).toBeInTheDocument()
    expect(screen.getByText('1.1.0')).toBeInTheDocument()
    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.getByText('staging')).toBeInTheDocument()
  })

  it('shows empty state when no releases', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={[]}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    expect(screen.getByText('No releases yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first release above to start tracking versions and uploading source maps.')).toBeInTheDocument()
  })

  it('can fill in new release form', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    // Fill in the form
    const versionInput = screen.getByPlaceholderText('e.g., 1.2.3, v2.0.0-beta.1')
    fireEvent.change(versionInput, {
      target: { value: '1.2.0' }
    })

    const environmentSelect = screen.getByRole('combobox')
    fireEvent.change(environmentSelect, {
      target: { value: 'staging' }
    })

    const notesTextarea = screen.getByPlaceholderText("What's new in this release...")
    fireEvent.change(notesTextarea, {
      target: { value: 'Bug fixes and improvements' }
    })

    expect(versionInput).toHaveValue('1.2.0')
    expect(environmentSelect).toHaveValue('staging')
    expect(notesTextarea).toHaveValue('Bug fixes and improvements')
  })

  it('shows upload guide when clicked', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    fireEvent.click(screen.getByText('📖 Upload Guide'))

    expect(screen.getByText('🚀 Source Map Upload Guide')).toBeInTheDocument()
    expect(screen.getByText('Option 1: File Upload (Recommended)')).toBeInTheDocument()
    expect(screen.getByText('Option 2: CLI Upload')).toBeInTheDocument()
  })

  it('generates correct CLI upload command', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    const expectedCommand = 'PROJECT_SLUG=test-project RELEASE_VERSION=1.0.0 RELEASE_ENV=production node upload_sourcemap.mjs'
    expect(screen.getByText(expectedCommand)).toBeInTheDocument()
  })

  it('has upload file buttons', () => {
    render(
      <ReleasesPage
        selected={mockProject}
        releases={mockReleases}
        onReleaseCreated={mockOnReleaseCreated}
      />
    )

    const uploadButtons = screen.getAllByText('Upload Files')
    expect(uploadButtons).toHaveLength(mockReleases.length)
  })
})