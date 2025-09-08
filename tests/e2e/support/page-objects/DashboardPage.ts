import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly url: string;

  // Navigation elements
  readonly projectDropdown: Locator;
  readonly createProjectButton: Locator;
  readonly dashboardTitle: Locator;

  // Project creation modal/form
  readonly projectNameInput: Locator;
  readonly projectSlugInput: Locator;
  readonly createProjectSubmitButton: Locator;
  readonly projectCreationModal: Locator;

  // Content areas
  readonly eventsSection: Locator;
  readonly issuesSection: Locator;
  readonly dashboardCharts: Locator;
  readonly emptyStateMessage: Locator;

  // Project information
  readonly ingestTokenDisplay: Locator;
  readonly projectConfigSection: Locator;

  // Alerts and messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly validationError: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.url = baseUrl;

    // Initialize locators
    this.projectDropdown = page.locator('[data-testid="project-dropdown"], select[name="project"]');
    this.createProjectButton = page.locator('[data-testid="create-project-button"], button:has-text("Create Project")');
    this.dashboardTitle = page.locator('h1, [data-testid="dashboard-title"]');

    // Project creation form
    this.projectNameInput = page.locator('[data-testid="project-name-input"], input[name="name"]');
    this.projectSlugInput = page.locator('[data-testid="project-slug-input"], input[name="slug"]');
    this.createProjectSubmitButton = page.locator('[data-testid="create-project-submit"], button[type="submit"]');
    this.projectCreationModal = page.locator('[data-testid="project-creation-modal"], .modal, .dialog');

    // Content sections
    this.eventsSection = page.locator('[data-testid="events-section"], .events-section');
    this.issuesSection = page.locator('[data-testid="issues-section"], .issues-section');
    this.dashboardCharts = page.locator('[data-testid="dashboard-charts"], .dashboard-charts, .chart-container');
    this.emptyStateMessage = page.locator('[data-testid="empty-state"], .empty-state');

    // Project info
    this.ingestTokenDisplay = page.locator('[data-testid="ingest-token"], .ingest-token, .token');
    this.projectConfigSection = page.locator('[data-testid="project-config"], .project-config');

    // Messages
    this.successMessage = page.locator('[data-testid="success-message"], .success, .alert-success');
    this.errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
    this.validationError = page.locator('[data-testid="validation-error"], .validation-error, .field-error');
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitForLoad(): Promise<void> {
    // Wait for the dashboard to be fully loaded
    await this.page.waitForLoadState('networkidle');
    
    // Check for common dashboard elements
    try {
      await Promise.race([
        this.dashboardTitle.waitFor({ timeout: 5000 }),
        this.projectDropdown.waitFor({ timeout: 5000 }),
        this.page.waitForSelector('h1', { timeout: 5000 })
      ]);
    } catch (error) {
      console.log('Dashboard elements not found, page might have different structure');
    }
  }

  async createProject(name: string, slug: string): Promise<void> {
    // Click create project button
    await this.createProjectButton.click();
    
    // Fill in project details
    await this.projectNameInput.fill(name);
    await this.projectSlugInput.fill(slug);
    
    // Submit the form
    await this.createProjectSubmitButton.click();
  }

  async selectProject(nameOrSlug: string): Promise<void> {
    // Open project dropdown and select project
    await this.projectDropdown.click();
    await this.page.locator(`option:has-text("${nameOrSlug}"), [data-value="${nameOrSlug}"]`).click();
  }

  async getProjectList(): Promise<string[]> {
    // Get all project options from dropdown
    await this.projectDropdown.click();
    const options = await this.page.locator('option, [role="option"]').allTextContents();
    await this.projectDropdown.click(); // Close dropdown
    return options.filter(option => option.trim() !== '');
  }

  async getIngestToken(): Promise<string | null> {
    try {
      await this.ingestTokenDisplay.waitFor({ timeout: 5000 });
      return await this.ingestTokenDisplay.textContent();
    } catch {
      return null;
    }
  }

  async isProjectInList(projectName: string): Promise<boolean> {
    const projectList = await this.getProjectList();
    return projectList.some(project => project.includes(projectName));
  }

  async hasEmptyState(): Promise<boolean> {
    try {
      await this.emptyStateMessage.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessage(): Promise<string | null> {
    try {
      await this.successMessage.waitFor({ timeout: 5000 });
      return await this.successMessage.textContent();
    } catch {
      return null;
    }
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async getValidationError(): Promise<string | null> {
    try {
      await this.validationError.waitFor({ timeout: 5000 });
      return await this.validationError.textContent();
    } catch {
      return null;
    }
  }

  // Dashboard-specific methods
  async hasEventData(): Promise<boolean> {
    try {
      // Look for data in events section or charts
      const hasEvents = await this.eventsSection.isVisible();
      const hasChartData = await this.page.locator('.chart-data, [data-has-data="true"]').isVisible();
      return hasEvents || hasChartData;
    } catch {
      return false;
    }
  }

  async hasIssueData(): Promise<boolean> {
    try {
      // Look for data in issues section
      return await this.issuesSection.isVisible();
    } catch {
      return false;
    }
  }

  async getDashboardInstructions(): Promise<string | null> {
    try {
      const instructions = this.page.locator('[data-testid="first-event-instructions"], .instructions, .getting-started');
      await instructions.waitFor({ timeout: 5000 });
      return await instructions.textContent();
    } catch {
      return null;
    }
  }

  async createProjectIfNeeded(projectName: string, projectSlug: string): Promise<void> {
    // Check if project already exists
    if (await this.isProjectInDropdown(projectName)) {
      await this.switchToProject(projectName);
      return;
    }

    // Create new project
    await this.createProject(projectName, projectSlug);
    
    // Wait for project to be created and available
    await this.page.waitForTimeout(2000);
  }

  async getProjectToken(projectName: string): Promise<string> {
    // Switch to the project
    await this.switchToProject(projectName);
    
    // Navigate to project settings or look for token display
    // This implementation depends on how Mini Sentry displays project tokens
    const tokenElement = this.page.locator('[data-testid="project-token"], [data-testid="client-key"]');
    
    try {
      await tokenElement.waitFor({ timeout: 5000 });
      return await tokenElement.textContent() || 'default-test-token';
    } catch {
      // Fallback to default token for testing
      return 'default-test-token';
    }
  }

  async switchToProject(projectName: string): Promise<void> {
    await this.selectProject(projectName);
    await this.waitForLoad();
  }

  async isProjectInDropdown(projectName: string): Promise<boolean> {
    return await this.isProjectInList(projectName);
  }
}