import { Page, Locator } from '@playwright/test';

export class ErrorDetailsPage {
  private page: Page;
  
  // Main error info locators
  private readonly errorMessage: Locator;
  private readonly errorTitle: Locator;
  private readonly errorLevel: Locator;
  private readonly errorTimestamp: Locator;
  private readonly errorOccurrenceCount: Locator;
  
  // Stack trace locators
  private readonly stackTrace: Locator;
  private readonly stackFrames: Locator;
  private readonly sourceCode: Locator;
  
  // Context and metadata locators
  private readonly userContext: Locator;
  private readonly userId: Locator;
  private readonly userEmail: Locator;
  private readonly tags: Locator;
  private readonly extraData: Locator;
  private readonly environment: Locator;
  private readonly release: Locator;
  private readonly breadcrumbs: Locator;
  
  // Navigation and action locators
  private readonly backButton: Locator;
  private readonly resolveButton: Locator;
  private readonly assignButton: Locator;
  private readonly shareButton: Locator;
  
  // Tabs locators
  private readonly detailsTab: Locator;
  private readonly stackTraceTab: Locator;
  private readonly contextTab: Locator;
  private readonly breadcrumbsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main error information
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.errorTitle = page.locator('[data-testid="error-title"]');
    this.errorLevel = page.locator('[data-testid="error-level"]');
    this.errorTimestamp = page.locator('[data-testid="error-timestamp"]');
    this.errorOccurrenceCount = page.locator('[data-testid="error-occurrence-count"]');
    
    // Stack trace information
    this.stackTrace = page.locator('[data-testid="error-stack-trace"]');
    this.stackFrames = page.locator('[data-testid="stack-frame"]');
    this.sourceCode = page.locator('[data-testid="source-code"]');
    
    // Context and metadata
    this.userContext = page.locator('[data-testid="error-user-context"]');
    this.userId = page.locator('[data-testid="error-user-id"]');
    this.userEmail = page.locator('[data-testid="error-user-email"]');
    this.tags = page.locator('[data-testid="error-tags"]');
    this.extraData = page.locator('[data-testid="error-extra-data"]');
    this.environment = page.locator('[data-testid="error-environment"]');
    this.release = page.locator('[data-testid="error-release"]');
    this.breadcrumbs = page.locator('[data-testid="error-breadcrumbs"]');
    
    // Navigation and actions
    this.backButton = page.locator('[data-testid="back-to-errors-button"]');
    this.resolveButton = page.locator('[data-testid="resolve-error-button"]');
    this.assignButton = page.locator('[data-testid="assign-error-button"]');
    this.shareButton = page.locator('[data-testid="share-error-button"]');
    
    // Tab navigation
    this.detailsTab = page.locator('[data-testid="details-tab"]');
    this.stackTraceTab = page.locator('[data-testid="stack-trace-tab"]');
    this.contextTab = page.locator('[data-testid="context-tab"]');
    this.breadcrumbsTab = page.locator('[data-testid="breadcrumbs-tab"]');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  // Error Information Methods
  async getErrorMessage(): Promise<string | null> {
    await this.waitForPageToLoad();
    return await this.errorMessage.textContent();
  }

  async getErrorTitle(): Promise<string | null> {
    return await this.errorTitle.textContent();
  }

  async getErrorLevel(): Promise<string | null> {
    return await this.errorLevel.textContent();
  }

  async getErrorTimestamp(): Promise<string | null> {
    return await this.errorTimestamp.textContent();
  }

  async getOccurrenceCount(): Promise<string | null> {
    return await this.errorOccurrenceCount.textContent();
  }

  // Stack Trace Methods
  async hasStackTrace(): Promise<boolean> {
    return await this.stackTrace.isVisible();
  }

  async getStackTraceContent(): Promise<string | null> {
    await this.stackTraceTab.click();
    await this.stackTrace.waitFor({ state: 'visible' });
    return await this.stackTrace.textContent();
  }

  async getStackFrameCount(): Promise<number> {
    await this.stackTraceTab.click();
    return await this.stackFrames.count();
  }

  async clickStackFrame(index: number): Promise<void> {
    await this.stackTraceTab.click();
    await this.stackFrames.nth(index).click();
  }

  async hasSourceCode(): Promise<boolean> {
    return await this.sourceCode.isVisible();
  }

  // Context and Metadata Methods
  async hasUserContext(): Promise<boolean> {
    await this.contextTab.click();
    return await this.userContext.isVisible();
  }

  async getUserId(): Promise<string | null> {
    await this.contextTab.click();
    return await this.userId.textContent();
  }

  async getUserEmail(): Promise<string | null> {
    await this.contextTab.click();
    return await this.userEmail.textContent();
  }

  async getTags(): Promise<string | null> {
    await this.contextTab.click();
    return await this.tags.textContent();
  }

  async getExtraData(): Promise<string | null> {
    await this.contextTab.click();
    return await this.extraData.textContent();
  }

  async getEnvironment(): Promise<string | null> {
    return await this.environment.textContent();
  }

  async getRelease(): Promise<string | null> {
    return await this.release.textContent();
  }

  async hasTag(tagKey: string, tagValue?: string): Promise<boolean> {
    await this.contextTab.click();
    const tagsContent = await this.tags.textContent();
    
    if (!tagsContent) return false;
    
    if (tagValue) {
      return tagsContent.includes(`${tagKey}: ${tagValue}`);
    } else {
      return tagsContent.includes(tagKey);
    }
  }

  async hasExtraDataKey(key: string): Promise<boolean> {
    await this.contextTab.click();
    const extraDataContent = await this.extraData.textContent();
    return extraDataContent?.includes(key) || false;
  }

  // Breadcrumbs Methods
  async hasBreadcrumbs(): Promise<boolean> {
    await this.breadcrumbsTab.click();
    return await this.breadcrumbs.isVisible();
  }

  async getBreadcrumbCount(): Promise<number> {
    await this.breadcrumbsTab.click();
    const breadcrumbItems = this.breadcrumbs.locator('[data-testid="breadcrumb-item"]');
    return await breadcrumbItems.count();
  }

  async getBreadcrumbByIndex(index: number): Promise<string | null> {
    await this.breadcrumbsTab.click();
    const breadcrumbItems = this.breadcrumbs.locator('[data-testid="breadcrumb-item"]');
    return await breadcrumbItems.nth(index).textContent();
  }

  // Navigation Methods
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async switchToTab(tab: 'details' | 'stack-trace' | 'context' | 'breadcrumbs'): Promise<void> {
    switch (tab) {
      case 'details':
        await this.detailsTab.click();
        break;
      case 'stack-trace':
        await this.stackTraceTab.click();
        break;
      case 'context':
        await this.contextTab.click();
        break;
      case 'breadcrumbs':
        await this.breadcrumbsTab.click();
        break;
    }
  }

  // Action Methods
  async resolveError(): Promise<void> {
    await this.resolveButton.click();
    
    // Wait for confirmation or status update
    await this.page.waitForTimeout(1000);
  }

  async assignError(assignee?: string): Promise<void> {
    await this.assignButton.click();
    
    if (assignee) {
      // Fill assignee field if provided
      const assigneeInput = this.page.locator('[data-testid="assignee-input"]');
      await assigneeInput.fill(assignee);
      
      const assignConfirmButton = this.page.locator('[data-testid="assign-confirm-button"]');
      await assignConfirmButton.click();
    }
  }

  async shareError(): Promise<string | null> {
    await this.shareButton.click();
    
    // Get the share URL
    const shareUrlInput = this.page.locator('[data-testid="share-url-input"]');
    await shareUrlInput.waitFor({ state: 'visible' });
    
    return await shareUrlInput.inputValue();
  }

  // Verification Methods
  async verifyErrorContainsText(expectedText: string): Promise<boolean> {
    const errorMessage = await this.getErrorMessage();
    const stackTrace = await this.getStackTraceContent();
    const tags = await this.getTags();
    const extraData = await this.getExtraData();
    
    const allContent = [errorMessage, stackTrace, tags, extraData]
      .filter(content => content !== null)
      .join(' ');
    
    return allContent.toLowerCase().includes(expectedText.toLowerCase());
  }

  async verifyReleaseBuildInfo(release: string, environment: string): Promise<boolean> {
    const actualRelease = await this.getRelease();
    const actualEnvironment = await this.getEnvironment();
    
    return (actualRelease?.includes(release) || false) && 
           (actualEnvironment?.includes(environment) || false);
  }

  async verifyUserContextComplete(userId: string, email: string): Promise<boolean> {
    const actualUserId = await this.getUserId();
    const actualUserEmail = await this.getUserEmail();
    
    return (actualUserId?.includes(userId) || false) && 
           (actualUserEmail?.includes(email) || false);
  }

  // Wait for real-time updates (for testing live error ingestion)
  async waitForOccurrenceCountUpdate(expectedCount: number, timeout: number = 10000): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        (expectedCount) => {
          const countElement = document.querySelector('[data-testid="error-occurrence-count"]');
          if (!countElement) return false;
          
          const countText = countElement.textContent || '';
          const actualCount = parseInt(countText.replace(/\D/g, '')) || 0;
          return actualCount >= expectedCount;
        },
        expectedCount,
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }
}