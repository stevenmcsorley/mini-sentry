import { render, screen } from '@testing-library/react'
import { LevelBadge } from '../LevelBadge'

describe('LevelBadge', () => {
  it('renders default variant with level text', () => {
    render(<LevelBadge level="error" />)
    
    expect(screen.getByTestId('level-badge')).toBeInTheDocument()
    expect(screen.getByTestId('level-badge-indicator')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('renders compact variant as dot only', () => {
    render(<LevelBadge level="warning" variant="compact" />)
    
    expect(screen.getByTestId('level-badge-dot')).toBeInTheDocument()
    expect(screen.queryByText('warning')).not.toBeInTheDocument()
  })

  it('applies correct styles for error level', () => {
    render(<LevelBadge level="error" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-red-500/20', 'text-red-300', 'border-red-500/30')
    expect(indicator).toHaveClass('bg-red-500')
  })

  it('applies correct styles for warning level', () => {
    render(<LevelBadge level="warning" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-amber-500/20', 'text-amber-300', 'border-amber-500/30')
    expect(indicator).toHaveClass('bg-amber-400')
  })

  it('applies correct styles for info level', () => {
    render(<LevelBadge level="info" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30')
    expect(indicator).toHaveClass('bg-blue-400')
  })

  it('applies correct styles for debug level', () => {
    render(<LevelBadge level="debug" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-gray-500/20', 'text-gray-300', 'border-gray-500/30')
    expect(indicator).toHaveClass('bg-gray-400')
  })

  it('handles case-insensitive level matching', () => {
    render(<LevelBadge level="ERROR" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-red-500/20', 'text-red-300', 'border-red-500/30')
    expect(indicator).toHaveClass('bg-red-500')
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('falls back to info styles for unknown levels', () => {
    render(<LevelBadge level="custom" />)
    
    const badge = screen.getByTestId('level-badge')
    const indicator = screen.getByTestId('level-badge-indicator')
    
    expect(badge).toHaveClass('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30')
    expect(indicator).toHaveClass('bg-blue-400')
    expect(screen.getByText('custom')).toBeInTheDocument()
  })

  it('compact variant applies correct dot styles', () => {
    render(<LevelBadge level="error" variant="compact" />)
    
    const dot = screen.getByTestId('level-badge-dot')
    expect(dot).toHaveClass('bg-red-500', 'h-2', 'w-2', 'rounded-full')
  })

  it('compact variant has title attribute with level', () => {
    render(<LevelBadge level="warning" variant="compact" />)
    
    const dot = screen.getByTestId('level-badge-dot')
    expect(dot).toHaveAttribute('title', 'warning')
  })

  it('applies custom testId', () => {
    render(<LevelBadge level="info" testId="custom-badge" />)
    
    expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    expect(screen.getByTestId('custom-badge-indicator')).toBeInTheDocument()
  })

  it('applies custom testId to compact variant', () => {
    render(<LevelBadge level="info" variant="compact" testId="custom-badge" />)
    
    expect(screen.getByTestId('custom-badge-dot')).toBeInTheDocument()
  })

  it('capitalizes level text in display', () => {
    render(<LevelBadge level="error" />)
    
    const levelText = screen.getByText('error')
    expect(levelText).toHaveClass('capitalize')
  })

  it('renders with all expected CSS classes for default variant', () => {
    render(<LevelBadge level="warning" />)
    
    const badge = screen.getByTestId('level-badge')
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'gap-1',
      'rounded',
      'border',
      'px-2',
      'py-1',
      'text-xs',
      'font-medium'
    )
  })
})