import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToggleSwitch } from '../ToggleSwitch'

describe('ToggleSwitch', () => {
  const mockOnToggle = vi.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('renders correctly with label', () => {
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
        label="Test Toggle"
      />
    )
    
    expect(screen.getByText('Test Toggle')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('shows enabled state correctly', () => {
    render(
      <ToggleSwitch
        enabled={true}
        onToggle={mockOnToggle}
        label="Test Toggle"
      />
    )
    
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup()
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
        label="Test Toggle"
      />
    )
    
    const toggle = screen.getByRole('switch')
    await user.click(toggle)
    
    expect(mockOnToggle).toHaveBeenCalledWith(true)
  })

  it('toggles from enabled to disabled', async () => {
    const user = userEvent.setup()
    render(
      <ToggleSwitch
        enabled={true}
        onToggle={mockOnToggle}
        label="Test Toggle"
      />
    )
    
    const toggle = screen.getByRole('switch')
    await user.click(toggle)
    
    expect(mockOnToggle).toHaveBeenCalledWith(false)
  })

  it('works without label', () => {
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
      />
    )
    
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.queryByText('Test Toggle')).not.toBeInTheDocument()
  })

  it('applies custom testId', () => {
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
        testId="custom-toggle"
      />
    )
    
    expect(screen.getByTestId('custom-toggle')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
        className="custom-class"
      />
    )
    
    const container = screen.getByRole('switch').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('shows live indicator when enabled', () => {
    render(
      <ToggleSwitch
        enabled={true}
        onToggle={mockOnToggle}
        label="Real-time"
      />
    )
    
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    // Check for the animated dot
    const liveDot = screen.getByText('LIVE').previousElementSibling
    expect(liveDot).toHaveClass('bg-green-500', 'animate-pulse')
  })

  it('hides live indicator when disabled', () => {
    render(
      <ToggleSwitch
        enabled={false}
        onToggle={mockOnToggle}
        label="Real-time"
      />
    )
    
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
  })
})