import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReleaseForm } from '../ReleaseForm'

describe('ReleaseForm', () => {
  const mockOnCreate = vi.fn()
  
  beforeEach(() => {
    mockOnCreate.mockClear()
  })

  it('renders form elements correctly', () => {
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    expect(screen.getByTestId('release-form')).toBeInTheDocument()
    expect(screen.getByTestId('release-version-input')).toBeInTheDocument()
    expect(screen.getByTestId('release-environment-select')).toBeInTheDocument()
    expect(screen.getByTestId('create-release-button')).toBeInTheDocument()
  })

  it('has correct default values', () => {
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input') as HTMLInputElement
    const environmentSelect = screen.getByTestId('release-environment-select') as HTMLSelectElement
    
    expect(versionInput.value).toBe('')
    expect(environmentSelect.value).toBe('production')
    expect(screen.getByText('Create Release')).toBeInTheDocument()
  })

  it('disables submit button when version is empty', () => {
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const submitButton = screen.getByTestId('create-release-button')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when version is filled', async () => {
    const user = userEvent.setup()
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input')
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '1.2.3')
    
    expect(submitButton).toBeEnabled()
  })

  it('calls onCreate with correct parameters on form submission', async () => {
    const user = userEvent.setup()
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input')
    const environmentSelect = screen.getByTestId('release-environment-select')
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '1.2.3')
    await user.selectOptions(environmentSelect, 'staging')
    await user.click(submitButton)
    
    expect(mockOnCreate).toHaveBeenCalledWith('1.2.3', 'staging')
  })

  it('calls onCreate on form submit event', async () => {
    const user = userEvent.setup()
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const form = screen.getByTestId('release-form')
    const versionInput = screen.getByTestId('release-version-input')
    
    await user.type(versionInput, '2.0.0')
    fireEvent.submit(form)
    
    expect(mockOnCreate).toHaveBeenCalledWith('2.0.0', 'production')
  })

  it('clears version input after successful submission', async () => {
    const user = userEvent.setup()
    mockOnCreate.mockResolvedValue(undefined)
    
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input') as HTMLInputElement
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '1.2.3')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(versionInput.value).toBe('')
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockOnCreate.mockReturnValue(promise)
    
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input')
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '1.2.3')
    await user.click(submitButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    resolvePromise!()
    await waitFor(() => {
      expect(screen.getByText('Create Release')).toBeInTheDocument()
    })
  })

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnCreate.mockRejectedValue(new Error('Network error'))
    
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input')
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '1.2.3')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create release:', expect.any(Error))
    })
    
    expect(screen.getByText('Create Release')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('respects external loading prop', () => {
    render(<ReleaseForm onCreate={mockOnCreate} isLoading={true} />)
    
    const submitButton = screen.getByTestId('create-release-button')
    const versionInput = screen.getByTestId('release-version-input')
    
    expect(submitButton).toBeDisabled()
    expect(versionInput).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<ReleaseForm onCreate={mockOnCreate} className="custom-class" />)
    
    const form = screen.getByTestId('release-form')
    expect(form).toHaveClass('custom-class')
  })

  it('applies custom testId', () => {
    render(<ReleaseForm onCreate={mockOnCreate} testId="custom-form" />)
    
    expect(screen.getByTestId('custom-form')).toBeInTheDocument()
  })

  it('has all environment options', () => {
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const environmentSelect = screen.getByTestId('release-environment-select')
    const options = Array.from(environmentSelect.querySelectorAll('option')).map(opt => opt.value)
    
    expect(options).toEqual(['production', 'staging', 'development', 'testing'])
  })

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup()
    render(<ReleaseForm onCreate={mockOnCreate} />)
    
    const versionInput = screen.getByTestId('release-version-input')
    const submitButton = screen.getByTestId('create-release-button')
    
    await user.type(versionInput, '  1.2.3  ')
    await user.click(submitButton)
    
    expect(mockOnCreate).toHaveBeenCalledWith('1.2.3', 'production')
  })
})