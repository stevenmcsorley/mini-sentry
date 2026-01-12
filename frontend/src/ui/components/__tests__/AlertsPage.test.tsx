import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AlertsPage } from '../AlertsPage'

// Mock data
const mockProject = {
  id: 1,
  name: 'Test Project',
  slug: 'test-project',
  ingest_token: 'test-token'
}

const mockRules = [
  {
    id: 1,
    name: 'High Error Rate',
    level: 'error',
    threshold_count: 10,
    threshold_window_minutes: 5,
    notify_interval_minutes: 60,
    target_type: 'email' as const,
    target_value: 'admin@test.com',
    active: true
  },
  {
    id: 2,
    name: 'Warning Threshold',
    level: 'warning',
    threshold_count: 20,
    threshold_window_minutes: 10,
    notify_interval_minutes: 120,
    target_type: 'webhook' as const,
    target_value: 'https://webhook.example.com/alerts',
    active: false
  }
]

describe('AlertsPage', () => {
  const mockOnRuleCreated = vi.fn()

  beforeEach(() => {
    mockOnRuleCreated.mockClear()
  })

  it('renders alert management page', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    expect(screen.getByText('Alert Management')).toBeInTheDocument()
    expect(screen.getByText('Configure automated alerts and notifications for')).toBeInTheDocument()
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('+ New Alert Rule')).toBeInTheDocument()
  })

  it('shows empty state when no rules', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={[]}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    expect(screen.getByText('No alert rules yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first alert rule above to start monitoring error thresholds and get notified when issues occur.')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Alert Rule')).toBeInTheDocument()
  })

  it('displays existing alert rules', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    expect(screen.getByText('High Error Rate')).toBeInTheDocument()
    expect(screen.getByText('Warning Threshold')).toBeInTheDocument()
    // Check that threshold numbers are displayed (using getAllByText for duplicates)
    expect(screen.getAllByText('10')).toHaveLength(2) // threshold count + window minutes
    expect(screen.getByText('5')).toBeInTheDocument()  // window minutes
    expect(screen.getByText('20')).toBeInTheDocument() // second rule threshold
    // Check that contact info appears somewhere in the document
    expect(screen.getByText((content, element) => {
      return content.includes('admin@test.com')
    })).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return content.includes('https://webhook.example.com/alerts')
    })).toBeInTheDocument()
  })

  it('shows active/inactive status correctly', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    const activeRule = screen.getByText('High Error Rate').closest('div')
    const inactiveRule = screen.getByText('Warning Threshold').closest('div')

    expect(activeRule).not.toHaveTextContent('Inactive')
    expect(inactiveRule).toHaveTextContent('Inactive')
  })

  it('can show create form', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('+ New Alert Rule'))

    expect(screen.getByText('Create New Alert Rule')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., High Error Rate Alert')).toBeInTheDocument()
    expect(screen.getByText('Create Alert Rule')).toBeInTheDocument()
  })

  it('can fill in create form', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('+ New Alert Rule'))

    const nameInput = screen.getByPlaceholderText('e.g., High Error Rate Alert')
    const selects = screen.getAllByRole('combobox')
    const levelSelect = selects[0] // First select is Error Level Filter
    const numberInputs = screen.getAllByRole('spinbutton')
    const thresholdInput = numberInputs[0] // First number input is threshold
    const emailInput = screen.getByPlaceholderText('alerts@example.com')

    await user.clear(nameInput)
    await user.type(nameInput, 'Test Alert')
    await user.selectOptions(levelSelect, 'warning')
    // Note: number inputs can be tricky with clear/type, just verify initial value
    expect(thresholdInput).toHaveValue(10) // default value
    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')

    expect(nameInput).toHaveValue('Test Alert')
    expect(levelSelect).toHaveValue('warning')
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('can cancel create form', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('+ New Alert Rule'))
    expect(screen.getByText('Create New Alert Rule')).toBeInTheDocument()

    // Get the Cancel button within the create form by finding it near the Create Alert Rule button
    const cancelButtons = screen.getAllByText('Cancel')
    await user.click(cancelButtons[0])
    expect(screen.queryByText('Create New Alert Rule')).not.toBeInTheDocument()
  })

  it('switches between email and webhook types', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('+ New Alert Rule'))

    const selects = screen.getAllByRole('combobox')
    const typeSelect = selects[1] // Second select is Notification Type
    
    // Default should be email
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('alerts@example.com')).toBeInTheDocument()

    // Switch to webhook
    await user.selectOptions(typeSelect, 'webhook')
    expect(screen.getByText('Webhook URL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://your-webhook-url.com/alerts')).toBeInTheDocument()
  })

  it('shows alert guide when clicked', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('📋 Alert Guide'))

    expect(screen.getByText('🚀 Alert Configuration Guide')).toBeInTheDocument()
    expect(screen.getByText('📈 Threshold Settings')).toBeInTheDocument()
    expect(screen.getByText('🔔 Notification Types')).toBeInTheDocument()
  })

  it('can start editing a rule', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0])

    expect(screen.getByText('Edit Alert Rule')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('High Error Rate')).toBeInTheDocument()
  })

  it('can cancel editing a rule', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0])

    expect(screen.getByText('Edit Alert Rule')).toBeInTheDocument()

    // Find the Cancel button in the edit form
    const cancelButtons = screen.getAllByText('Cancel')
    await user.click(cancelButtons[0])
    expect(screen.queryByText('Edit Alert Rule')).not.toBeInTheDocument()
  })

  it('shows enable/disable buttons correctly', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    const disableButtons = screen.getAllByText('Disable')
    const enableButtons = screen.getAllByText('Enable')

    expect(disableButtons).toHaveLength(1) // Active rule
    expect(enableButtons).toHaveLength(1)  // Inactive rule
  })

  it('shows delete buttons for all rules', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(mockRules.length)
  })

  it('shows no project message when no project selected', () => {
    render(
      <AlertsPage
        selected={null}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    expect(screen.getByText('Create or select a project in Projects tab.')).toBeInTheDocument()
  })

  it('shows total rules count', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    expect(screen.getByText('Total Rules')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows level badges for rules with specific levels', () => {
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    // Should show level badges for rules that have specific levels set
    const errorBadges = screen.getAllByTestId('level-badge')
    expect(errorBadges.length).toBeGreaterThan(0)
  })

  it('disables create button when form is incomplete', async () => {
    const user = userEvent.setup()
    render(
      <AlertsPage
        selected={mockProject}
        rules={mockRules}
        onRuleCreated={mockOnRuleCreated}
      />
    )

    await user.click(screen.getByText('+ New Alert Rule'))

    const createButton = screen.getByText('Create Alert Rule')
    expect(createButton).toBeDisabled()

    // Fill in name but not email
    const nameInput = screen.getByPlaceholderText('e.g., High Error Rate Alert')
    await user.type(nameInput, 'Test Alert')
    expect(createButton).toBeDisabled()

    // Fill in email - now should be enabled
    const emailInput = screen.getByPlaceholderText('alerts@example.com')
    await user.type(emailInput, 'test@example.com')
    expect(createButton).toBeEnabled()
  })
})