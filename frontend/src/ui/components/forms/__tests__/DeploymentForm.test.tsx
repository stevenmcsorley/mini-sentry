import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeploymentForm } from '../DeploymentForm'

describe('DeploymentForm', () => {
  const mockOnCreate = vi.fn()
  
  beforeEach(() => {
    mockOnCreate.mockClear()
  })

  it('renders form elements correctly', () => {
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    expect(screen.getByTestId('deployment-form')).toBeInTheDocument()
    expect(screen.getByTestId('deployment-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('deployment-url-input')).toBeInTheDocument()
    expect(screen.getByTestId('deployment-environment-input')).toBeInTheDocument()
    expect(screen.getByTestId('create-deployment-button')).toBeInTheDocument()
  })

  it('has correct default values', () => {
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input') as HTMLInputElement
    const urlInput = screen.getByTestId('deployment-url-input') as HTMLInputElement
    const envInput = screen.getByTestId('deployment-environment-input') as HTMLInputElement
    
    expect(nameInput.value).toBe('Deploy #1')
    expect(urlInput.value).toBe('https://example.com')
    expect(envInput.value).toBe('production')
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('submit button is enabled with default values', () => {
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const submitButton = screen.getByTestId('create-deployment-button')
    expect(submitButton).toBeEnabled()
  })

  it('disables submit button when required fields are empty', async () => {
    const user = userEvent.setup()
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input')
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.clear(nameInput)
    
    expect(submitButton).toBeDisabled()
  })

  it('calls onCreate with correct parameters on form submission', async () => {
    const user = userEvent.setup()
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input')
    const urlInput = screen.getByTestId('deployment-url-input')
    const envInput = screen.getByTestId('deployment-environment-input')
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.clear(nameInput)
    await user.type(nameInput, 'Custom Deploy')
    await user.clear(urlInput)
    await user.type(urlInput, 'https://custom.com')
    await user.clear(envInput)
    await user.type(envInput, 'staging')
    
    await user.click(submitButton)
    
    expect(mockOnCreate).toHaveBeenCalledWith('Custom Deploy', 'https://custom.com', 'staging')
  })

  it('calls onCreate on form submit event', async () => {
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const form = screen.getByTestId('deployment-form')
    fireEvent.submit(form)
    
    expect(mockOnCreate).toHaveBeenCalledWith('Deploy #1', 'https://example.com', 'production')
  })

  it('resets form to defaults after successful submission', async () => {
    const user = userEvent.setup()
    mockOnCreate.mockResolvedValue(undefined)
    
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input') as HTMLInputElement
    const urlInput = screen.getByTestId('deployment-url-input') as HTMLInputElement
    const envInput = screen.getByTestId('deployment-environment-input') as HTMLInputElement
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.clear(nameInput)
    await user.type(nameInput, 'Custom Deploy')
    await user.clear(urlInput)
    await user.type(urlInput, 'https://custom.com')
    await user.clear(envInput)
    await user.type(envInput, 'staging')
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(nameInput.value).toBe('Deploy #1')
      expect(urlInput.value).toBe('https://example.com')
      expect(envInput.value).toBe('production')
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    mockOnCreate.mockReturnValue(promise)
    
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.click(submitButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    resolvePromise!()
    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument()
    })
  })

  it('handles submission errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnCreate.mockRejectedValue(new Error('Network error'))
    
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create deployment:', expect.any(Error))
    })
    
    expect(screen.getByText('Create')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('respects external loading prop', () => {
    render(<DeploymentForm onCreate={mockOnCreate} isLoading={true} />)
    
    const submitButton = screen.getByTestId('create-deployment-button')
    const nameInput = screen.getByTestId('deployment-name-input')
    const urlInput = screen.getByTestId('deployment-url-input')
    const envInput = screen.getByTestId('deployment-environment-input')
    
    expect(submitButton).toBeDisabled()
    expect(nameInput).toBeDisabled()
    expect(urlInput).toBeDisabled()
    expect(envInput).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<DeploymentForm onCreate={mockOnCreate} className="custom-class" />)
    
    const form = screen.getByTestId('deployment-form')
    expect(form).toHaveClass('custom-class')
  })

  it('applies custom testId', () => {
    render(<DeploymentForm onCreate={mockOnCreate} testId="custom-form" />)
    
    expect(screen.getByTestId('custom-form')).toBeInTheDocument()
  })

  it('has correct input types', () => {
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input')
    const urlInput = screen.getByTestId('deployment-url-input')
    const envInput = screen.getByTestId('deployment-environment-input')
    
    expect(nameInput).toHaveAttribute('type', 'text')
    expect(urlInput).toHaveAttribute('type', 'url')
    expect(envInput).toHaveAttribute('type', 'text')
  })

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup()
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input')
    const urlInput = screen.getByTestId('deployment-url-input')
    const envInput = screen.getByTestId('deployment-environment-input')
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.clear(nameInput)
    await user.type(nameInput, '  Custom Deploy  ')
    await user.clear(urlInput)
    await user.type(urlInput, '  https://custom.com  ')
    await user.clear(envInput)
    await user.type(envInput, '  staging  ')
    
    await user.click(submitButton)
    
    expect(mockOnCreate).toHaveBeenCalledWith('Custom Deploy', 'https://custom.com', 'staging')
  })

  it('prevents submission with only whitespace values', async () => {
    const user = userEvent.setup()
    render(<DeploymentForm onCreate={mockOnCreate} />)
    
    const nameInput = screen.getByTestId('deployment-name-input')
    const submitButton = screen.getByTestId('create-deployment-button')
    
    await user.clear(nameInput)
    await user.type(nameInput, '   ')
    
    expect(submitButton).toBeDisabled()
    
    await user.click(submitButton)
    expect(mockOnCreate).not.toHaveBeenCalled()
  })
})