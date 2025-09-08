import { Page, Locator } from '@playwright/test';

export class TestAppPage {
  private page: Page;
  
  // Navigation elements
  private readonly homeLink: Locator;
  private readonly productsLink: Locator;
  private readonly cartLink: Locator;
  private readonly registerLink: Locator;
  private readonly errorTestingLink: Locator;
  
  // Error testing buttons
  private readonly javascriptErrorButton: Locator;
  private readonly networkErrorButton: Locator;
  private readonly asyncErrorButton: Locator;
  private readonly componentErrorButton: Locator;
  private readonly errorWithContextButton: Locator;
  private readonly errorWithExtraDataButton: Locator;
  
  // Status and feedback elements
  private readonly statusMessage: Locator;
  private readonly errorBoundaryMessage: Locator;
  private readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation selectors
    this.homeLink = page.locator('[data-testid="nav-home"]');
    this.productsLink = page.locator('[data-testid="nav-products"]');
    this.cartLink = page.locator('[data-testid="nav-cart"]');
    this.registerLink = page.locator('[data-testid="nav-register"]');
    this.errorTestingLink = page.locator('[data-testid="nav-error-testing"]');
    
    // Error testing button selectors
    this.javascriptErrorButton = page.locator('[data-testid="javascript-error-button"]');
    this.networkErrorButton = page.locator('[data-testid="network-error-button"]');
    this.asyncErrorButton = page.locator('[data-testid="async-error-button"]');
    this.componentErrorButton = page.locator('[data-testid="component-error-button"]');
    this.errorWithContextButton = page.locator('[data-testid="error-with-context-button"]');
    this.errorWithExtraDataButton = page.locator('[data-testid="error-with-extra-data-button"]');
    
    // Status and feedback selectors
    this.statusMessage = page.locator('[data-testid="status-message"]');
    this.errorBoundaryMessage = page.locator('[data-testid="error-boundary-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  }

  // Navigation methods
  async navigateToHome(): Promise<void> {
    await this.page.goto('http://localhost:3001');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProducts(): Promise<void> {
    await this.page.goto('http://localhost:3001/products');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCart(): Promise<void> {
    await this.page.goto('http://localhost:3001/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToRegister(): Promise<void> {
    await this.page.goto('http://localhost:3001/register');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToErrorTesting(): Promise<void> {
    await this.page.goto('http://localhost:3001/error-testing');
    await this.page.waitForLoadState('networkidle');
    
    // Verify we're on the error testing page
    const pageTitle = await this.page.locator('h1').textContent();
    if (!pageTitle?.includes('Error Testing')) {
      throw new Error('Failed to navigate to Error Testing page');
    }
  }

  // Error trigger methods
  async triggerJavaScriptError(): Promise<void> {
    await this.javascriptErrorButton.click();
    await this.page.waitForTimeout(500); // Wait for error to be triggered
  }

  async triggerNetworkError(): Promise<void> {
    await this.networkErrorButton.click();
    await this.page.waitForTimeout(1000); // Network errors might take longer
  }

  async triggerAsyncError(): Promise<void> {
    await this.asyncErrorButton.click();
    await this.page.waitForTimeout(2000); // Async errors take longer to manifest
  }

  async triggerComponentError(): Promise<void> {
    await this.componentErrorButton.click();
    await this.page.waitForTimeout(500);
    
    // Wait for error boundary to appear
    await this.errorBoundaryMessage.waitFor({ state: 'visible', timeout: 5000 });
  }

  async triggerErrorWithContext(): Promise<void> {
    await this.errorWithContextButton.click();
    await this.page.waitForTimeout(500);
  }

  async triggerErrorWithExtraData(): Promise<void> {
    await this.errorWithExtraDataButton.click();
    await this.page.waitForTimeout(500);
  }

  // Multiple error triggers for testing grouping
  async triggerMultipleJavaScriptErrors(count: number = 3): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.triggerJavaScriptError();
      await this.page.waitForTimeout(200); // Small delay between errors
    }
  }

  // Status checking methods
  async getStatusMessage(): Promise<string | null> {
    try {
      await this.statusMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.statusMessage.textContent();
    } catch {
      return null;
    }
  }

  async isErrorBoundaryActive(): Promise<boolean> {
    return await this.errorBoundaryMessage.isVisible();
  }

  async getErrorBoundaryMessage(): Promise<string | null> {
    if (await this.isErrorBoundaryActive()) {
      return await this.errorBoundaryMessage.textContent();
    }
    return null;
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  // Wait for errors to be sent to Mini Sentry
  async waitForErrorsToBeCapture(): Promise<void> {
    // Wait for any network requests to complete
    await this.page.waitForLoadState('networkidle');
    
    // Additional wait to ensure error is processed
    await this.page.waitForTimeout(1000);
  }

  // Utility methods for error testing scenarios
  async triggerErrorByType(errorType: string): Promise<void> {
    switch (errorType.toLowerCase()) {
      case 'javascript error':
        await this.triggerJavaScriptError();
        break;
      case 'network error':
        await this.triggerNetworkError();
        break;
      case 'async error':
        await this.triggerAsyncError();
        break;
      case 'component error':
        await this.triggerComponentError();
        break;
      case 'error with context':
        await this.triggerErrorWithContext();
        break;
      case 'error with extra data':
        await this.triggerErrorWithExtraData();
        break;
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }
    
    await this.waitForErrorsToBeCapture();
  }

  // Verify Mini Sentry client is loaded
  async verifyMiniSentryClientLoaded(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return typeof (window as any).miniSentryClient !== 'undefined';
    });
  }

  // Get client configuration for verification
  async getMiniSentryClientConfig(): Promise<any> {
    return await this.page.evaluate(() => {
      return (window as any).miniSentryConfig || null;
    });
  }

  // Get user context that should be sent with errors
  async getUserContext(): Promise<any> {
    return await this.page.evaluate(() => {
      return (window as any).miniSentryUser || null;
    });
  }

  // Get the last captured error for verification
  async getLastCapturedError(): Promise<any> {
    return await this.page.evaluate(() => {
      return (window as any).lastCapturedError || null;
    });
  }

  // Get all API calls made to Mini Sentry
  async getMiniSentryApiCalls(): Promise<any[]> {
    return await this.page.evaluate(() => {
      return (window as any).miniSentryApiCalls || [];
    });
  }

  // Reset error tracking state for clean test runs
  async resetErrorTracking(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).lastCapturedError = null;
      (window as any).miniSentryApiCalls = [];
    });
  }

  // Simulate user interactions that might trigger errors
  async performUserActions(): Promise<void> {
    // Click around the page to simulate user interaction
    await this.homeLink.click();
    await this.page.waitForTimeout(500);
    
    await this.productsLink.click();
    await this.page.waitForTimeout(500);
    
    await this.cartLink.click();
    await this.page.waitForTimeout(500);
    
    // Navigate to error testing page
    await this.navigateToErrorTesting();
  }

  // Check if specific error buttons are available
  async isErrorButtonAvailable(buttonType: string): Promise<boolean> {
    const buttonSelector = `[data-testid="${buttonType.toLowerCase().replace(/\s+/g, '-')}-button"]`;
    const button = this.page.locator(buttonSelector);
    return await button.isVisible();
  }

  // Get all available error buttons
  async getAvailableErrorButtons(): Promise<string[]> {
    const buttons = await this.page.locator('[data-testid$="-error-button"]').all();
    const buttonTypes = [];
    
    for (const button of buttons) {
      const testId = await button.getAttribute('data-testid');
      if (testId) {
        buttonTypes.push(testId.replace('-button', '').replace(/-/g, ' '));
      }
    }
    
    return buttonTypes;
  }

  // Reload page to reset error boundary
  async reloadPage(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }
}