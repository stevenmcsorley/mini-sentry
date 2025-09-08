import { Page, Locator } from '@playwright/test';

export class ErrorListPage {
  private page: Page;
  
  // Locators
  private readonly errorList: Locator;
  private readonly errorItems: Locator;
  private readonly errorGroups: Locator;
  private readonly loadingSpinner: Locator;
  private readonly emptyState: Locator;
  private readonly errorFilters: Locator;
  private readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Error list selectors
    this.errorList = page.locator('[data-testid="error-list"]');
    this.errorItems = page.locator('[data-testid="error-item"]');
    this.errorGroups = page.locator('[data-testid="error-group"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.emptyState = page.locator('[data-testid="empty-errors-state"]');
    
    // Filter and search selectors
    this.errorFilters = page.locator('[data-testid="error-filters"]');
    this.searchInput = page.locator('[data-testid="error-search-input"]');
  }

  async waitForErrorListToLoad(): Promise<void> {
    // Wait for either error list to appear or empty state
    await Promise.race([
      this.errorList.waitFor({ state: 'visible' }),
      this.emptyState.waitFor({ state: 'visible' })
    ]);
    
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async getErrorCount(): Promise<number> {
    await this.waitForErrorListToLoad();
    return await this.errorItems.count();
  }

  async getErrorGroupCount(): Promise<number> {
    await this.waitForErrorListToLoad();
    return await this.errorGroups.count();
  }

  async clickFirstError(): Promise<void> {
    await this.waitForErrorListToLoad();
    await this.errorItems.first().click();
  }

  async clickErrorByIndex(index: number): Promise<void> {
    await this.waitForErrorListToLoad();
    await this.errorItems.nth(index).click();
  }

  async getErrorTitleByIndex(index: number): Promise<string | null> {
    await this.waitForErrorListToLoad();
    const errorTitle = this.errorItems.nth(index).locator('[data-testid="error-title"]');
    return await errorTitle.textContent();
  }

  async getErrorOccurrenceCount(index: number = 0): Promise<string | null> {
    await this.waitForErrorListToLoad();
    const occurrenceCount = this.errorItems.nth(index).locator('[data-testid="error-occurrence-count"]');
    return await occurrenceCount.textContent();
  }

  async getErrorTimestamp(index: number = 0): Promise<string | null> {
    await this.waitForErrorListToLoad();
    const timestamp = this.errorItems.nth(index).locator('[data-testid="error-timestamp"]');
    return await timestamp.textContent();
  }

  async searchForErrors(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.waitForErrorListToLoad();
  }

  async filterErrorsByLevel(level: 'error' | 'warning' | 'info'): Promise<void> {
    const levelFilter = this.errorFilters.locator(`[data-testid="filter-level-${level}"]`);
    await levelFilter.click();
    await this.waitForErrorListToLoad();
  }

  async filterErrorsByTimeRange(range: 'hour' | 'day' | 'week' | 'month'): Promise<void> {
    const timeFilter = this.errorFilters.locator(`[data-testid="filter-time-${range}"]`);
    await timeFilter.click();
    await this.waitForErrorListToLoad();
  }

  async hasErrors(): Promise<boolean> {
    await this.waitForErrorListToLoad();
    return await this.errorItems.count() > 0;
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async getEmptyStateMessage(): Promise<string | null> {
    const emptyMessage = this.emptyState.locator('[data-testid="empty-message"]');
    return await emptyMessage.textContent();
  }

  // Wait for specific error to appear (useful for real-time testing)
  async waitForErrorWithMessage(message: string, timeout: number = 10000): Promise<boolean> {
    try {
      const errorWithMessage = this.page.locator(`[data-testid="error-item"]:has-text("${message}")`);
      await errorWithMessage.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Get all visible error messages
  async getAllErrorMessages(): Promise<string[]> {
    await this.waitForErrorListToLoad();
    const errorMessages = await this.errorItems.locator('[data-testid="error-title"]').allTextContents();
    return errorMessages.filter(message => message !== null) as string[];
  }

  // Check if errors are properly grouped
  async areErrorsGrouped(): Promise<boolean> {
    await this.waitForErrorListToLoad();
    const groupCount = await this.getErrorGroupCount();
    const individualErrorCount = await this.getErrorCount();
    
    // If we have error groups, they should contain multiple errors
    return groupCount > 0 && groupCount < individualErrorCount;
  }

  // Pagination support
  async goToNextPage(): Promise<void> {
    const nextButton = this.page.locator('[data-testid="pagination-next"]');
    await nextButton.click();
    await this.waitForErrorListToLoad();
  }

  async goToPreviousPage(): Promise<void> {
    const prevButton = this.page.locator('[data-testid="pagination-previous"]');
    await prevButton.click();
    await this.waitForErrorListToLoad();
  }

  async getCurrentPageNumber(): Promise<number> {
    const pageNumber = this.page.locator('[data-testid="current-page-number"]');
    const pageText = await pageNumber.textContent();
    return parseInt(pageText || '1');
  }
}