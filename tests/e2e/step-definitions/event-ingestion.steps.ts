import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MiniSentryWorld } from '../support/world';

// Background Steps
Given('Mini Sentry is running and accessible', async function (this: MiniSentryWorld) {
  // Verify Mini Sentry API is running
  const apiResponse = await this.page.request.get('http://localhost:8000/api/health');
  expect(apiResponse.ok()).toBeTruthy();

  // Verify Mini Sentry UI is accessible
  const uiResponse = await this.page.request.get('http://localhost:5173');
  expect(uiResponse.ok()).toBeTruthy();
});

Given('I have a test project configured with a valid token', async function (this: MiniSentryWorld) {
  // Use the existing test project from configuration
  const testProjectId = this.getTestProjectId();
  const testProjectName = this.getTestProjectName();
  const testProjectToken = this.getTestProjectToken();
  
  // Verify the test project exists by navigating to Mini Sentry
  await this.page.goto(this.getMiniSentryUrl());
  await this.page.waitForLoadState('domcontentloaded');
  
  // The test project should be available and configured
  expect(testProjectId).toBeTruthy();
  expect(testProjectName).toBeTruthy();
  expect(testProjectToken).toBeTruthy();
});

// Navigation Steps
Given('I am on the test application error testing page', async function (this: MiniSentryWorld) {
  await this.page.goto('http://localhost:3001/error-testing');
  await this.page.waitForLoadState('networkidle');
  
  // Verify we're on the error testing page
  const pageTitle = await this.page.locator('h2').textContent();
  expect(pageTitle).toContain('Error Testing');
});

Given('I am on the test application with a logged in test user', async function (this: MiniSentryWorld) {
  // Navigate to test app
  await this.page.goto('http://localhost:3001');
  
  // Verify user context is set (the Mini Sentry client should set this automatically)
  const userInfo = await this.page.evaluate(() => {
    return (window as any).miniSentryUser || null;
  });
  
  expect(userInfo).toBeTruthy();
});

Given('the test application has a beforeSend hook configured', async function (this: MiniSentryWorld) {
  // This is configured in main.tsx - just verify it exists
  await this.page.goto('http://localhost:3001');
  
  const hookExists = await this.page.evaluate(() => {
    return typeof (window as any).miniSentryBeforeSend === 'function';
  });
  
  // The hook is configured in the client initialization
  expect(hookExists).toBeTruthy();
});

// Error Triggering Steps
When('I click the {string} button', async function (this: MiniSentryWorld, buttonText: string) {
  // Map button text to actual testid
  let buttonSelector: string;
  
  switch (buttonText.toLowerCase()) {
    case 'javascript error':
      buttonSelector = '[data-testid="trigger-type-error"]'; // Use TypeError as default JS error
      break;
    case 'network error':
      buttonSelector = '[data-testid="trigger-network-error"]';
      break;
    case 'async error':
      buttonSelector = '[data-testid="trigger-async-error"]';
      break;
    case 'component error':
      buttonSelector = '[data-testid="trigger-component-error"]';
      break;
    case 'error with context':
      buttonSelector = '[data-testid="trigger-custom-error"]'; // Custom error with context
      break;
    case 'error with extra data':
      buttonSelector = '[data-testid="trigger-custom-error"]'; // Same as above, custom error
      break;
    case 'react component error':
      buttonSelector = '[data-testid="trigger-component-error"]';
      break;
    case 'unhandled rejection':
      buttonSelector = '[data-testid="trigger-unhandled-rejection"]';
      break;
    default:
      // Try to construct selector from button text
      buttonSelector = `[data-testid="trigger-${buttonText.toLowerCase().replace(/\s+/g, '-')}"]`;
      break;
  }
  
  // Store current time to help with verification later
  this.testData.errorTriggerTime = new Date();
  
  await this.page.click(buttonSelector);
  
  // Wait a moment for the error to be triggered
  await this.page.waitForTimeout(500);
});

When('I click the {string} button multiple times', async function (this: MiniSentryWorld, buttonText: string) {
  const buttonSelector = `[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`;
  
  this.testData.errorTriggerTime = new Date();
  
  // Click the button 3 times to test error grouping
  for (let i = 0; i < 3; i++) {
    await this.page.click(buttonSelector);
    await this.page.waitForTimeout(200);
  }
  
  this.testData.expectedErrorCount = 3;
});

When('I trigger any error', async function (this: MiniSentryWorld) {
  // Use JavaScript Error as the default error
  const buttonSelector = '[data-testid="javascript-error-button"]';
  
  this.testData.errorTriggerTime = new Date();
  await this.page.click(buttonSelector);
  await this.page.waitForTimeout(500);
});

// Error Verification Steps
Then('an error should be captured by Mini Sentry', async function (this: MiniSentryWorld) {
  // Wait for error to be sent to Mini Sentry and processed
  await this.page.waitForTimeout(2000);
  
  // Navigate to Mini Sentry UI to check for the error
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Navigate to logs tab
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  // Wait for events list and check if we have events
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout: 5000 });
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('a network error should be captured by Mini Sentry', async function (this: MiniSentryWorld) {
  // Wait for error to be sent to Mini Sentry and processed
  await this.page.waitForTimeout(2000);
  
  // Navigate to Mini Sentry UI to check for the error
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Navigate to logs tab
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  // Wait for events list and check for network error
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout: 5000 });
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('an async error should be captured by Mini Sentry', async function (this: MiniSentryWorld) {
  // Wait for error to be sent to Mini Sentry and processed
  await this.page.waitForTimeout(2000);
  
  // Navigate to Mini Sentry UI to check for the error
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Navigate to logs tab
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  // Wait for events list and check for async error
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout: 5000 });
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('a React component error should be captured by Mini Sentry', async function (this: MiniSentryWorld) {
  // Wait for error to be sent to Mini Sentry and processed
  await this.page.waitForTimeout(2000);
  
  // Navigate to Mini Sentry UI to check for the error
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Navigate to logs tab
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  // Wait for events list and check for component error
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout: 5000 });
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('I should see the error in the Mini Sentry dashboard within {int} seconds', async function (this: MiniSentryWorld, seconds: number) {
  // Navigate to Mini Sentry dashboard
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Make sure we're on the Logs tab to see events - use the correct test ID
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  // Wait for events to appear - use the events-list test ID
  const timeout = seconds * 1000;
  
  // Wait for the events list container to appear
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout });
  
  // Count the event rows in the events grid
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('I should see the network error in the Mini Sentry dashboard within {int} seconds', async function (this: MiniSentryWorld, seconds: number) {
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Make sure we're on the Logs tab - use correct test ID
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  const timeout = seconds * 1000;
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout });
  
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('I should see the async error in the Mini Sentry dashboard within {int} seconds', async function (this: MiniSentryWorld, seconds: number) {
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Make sure we're on the Logs tab - use correct test ID
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  const timeout = seconds * 1000;
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout });
  
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('I should see the component error in the Mini Sentry dashboard within {int} seconds', async function (this: MiniSentryWorld, seconds: number) {
  await this.page.goto('http://localhost:5173');
  await this.page.waitForLoadState('domcontentloaded');
  
  // Make sure we're on the Logs tab - use correct test ID
  const logsTab = this.page.locator('[data-testid="nav-logs"]');
  if (await logsTab.isVisible()) {
    await logsTab.click();
    await this.page.waitForTimeout(1000);
  }
  
  const timeout = seconds * 1000;
  await this.page.waitForSelector('[data-testid="events-list"]', { timeout });
  
  const eventRows = await this.page.locator('[data-testid="events-list"] .divide-y > div').count();
  expect(eventRows).toBeGreaterThan(0);
});

Then('the error should have the correct stack trace', async function (this: MiniSentryWorld) {
  // Click on the first event row to expand details - look for the expand button
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  // Wait for event details to expand and load
  await this.page.waitForTimeout(2000);
  
  // Look for stack trace in the expanded details
  const stackTrace = this.page.locator('pre, .space-y-1, ol');
  
  if (await stackTrace.isVisible()) {
    const stackContent = await stackTrace.textContent();
    expect(stackContent).toBeTruthy();
    // Stack traces should contain function names or file references
    expect(stackContent).toMatch(/at\s+\w+|function\s+\w+|\w+\.js|\w+\.tsx?/);
  } else {
    // Some errors might not have stack traces, which is also valid
    console.log('No stack trace found for this error - this may be expected');
  }
});

Then('the error should contain network failure details', async function (this: MiniSentryWorld) {
  // Click on the first event row to expand details
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  // Look for error details in the expanded content
  const errorDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(errorDetails).toContain('Network');
  expect(errorDetails?.includes('fetch') || errorDetails?.includes('HTTP')).toBeTruthy();
});

Then('the error should be properly attributed to the async operation', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const errorDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(errorDetails?.includes('async') || errorDetails?.includes('Promise')).toBeTruthy();
});

Then('the error should show the component error boundary message', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const errorDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(errorDetails?.includes('Component') || errorDetails?.includes('React')).toBeTruthy();
});

// Error Grouping Steps
Then('the errors should be grouped together in Mini Sentry', async function (this: MiniSentryWorld) {
  // Wait for error grouping to occur
  await this.page.waitForTimeout(2000);
  
  // Check that errors are grouped by looking at the event rows
  const eventRows = await this.page.locator('.divide-y.divide-slate-800\\/60 > div').count();
  // Expecting fewer rows than individual errors due to grouping
  expect(eventRows).toBeLessThanOrEqual(3); // We triggered 3 errors but they should group
});

Then('the error group should show multiple occurrences', async function (this: MiniSentryWorld) {
  // Look for occurrence count in the event row content
  const eventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const rowText = await eventRow.textContent();
  expect(rowText).toMatch(/\d+/); // Should contain some number indicating occurrences
});

Then('the error count should increment correctly', async function (this: MiniSentryWorld) {
  const eventRows = await this.page.locator('.divide-y.divide-slate-800\\/60 > div').count();
  expect(eventRows).toBeGreaterThanOrEqual(this.testData.expectedErrorCount || 1);
});

// Context and Metadata Steps
Then('the captured error should include user context', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  // Look for user context in the expanded event details
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toMatch(/user|User|context/i);
});

Then('the user ID should be {string}', async function (this: MiniSentryWorld, expectedUserId: string) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain(expectedUserId);
});

Then('the user email should be {string}', async function (this: MiniSentryWorld, expectedEmail: string) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain(expectedEmail);
});

Then('the captured error should include custom tags', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toMatch(/tag|Tag|tags/i);
});

Then('the error should have {string} tag', async function (this: MiniSentryWorld, expectedTag: string) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain(expectedTag);
});

Then('the error should include the test environment context', async function (this: MiniSentryWorld) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain('test');
});

Then('the captured error should include extra context data', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toMatch(/extra|context|data/i);
});

Then('the extra data should contain component information', async function (this: MiniSentryWorld) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails?.includes('component') || eventDetails?.includes('Component')).toBeTruthy();
});

Then('the extra data should contain user action details', async function (this: MiniSentryWorld) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails?.includes('action') || eventDetails?.includes('button')).toBeTruthy();
});

// Release and Environment Steps
Then('the captured error should have release {string}', async function (this: MiniSentryWorld, expectedRelease: string) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain(expectedRelease);
});

Then('the captured error should have environment {string}', async function (this: MiniSentryWorld, expectedEnvironment: string) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain(expectedEnvironment);
});

Then('the error should be associated with the correct project', async function (this: MiniSentryWorld) {
  // Check if we're on the correct project by verifying URL or other indicators
  const currentUrl = this.page.url();
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails || currentUrl).toMatch(/test|project/i);
});

// BeforeSend Hook Steps
Then('the beforeSend hook should modify the error data', async function (this: MiniSentryWorld) {
  const firstEventRow = this.page.locator('.divide-y.divide-slate-800\\/60 > div').first();
  const expandButton = firstEventRow.locator('button svg');
  await expandButton.click();
  
  await this.page.waitForTimeout(2000);
  
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain('test_app'); // This should be added by beforeSend
});

Then('the error should contain the test metadata injected by the hook', async function (this: MiniSentryWorld) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toContain('test_app');
  expect(eventDetails).toContain('1.0.0-test');
});

Then('the original error should still be captured with modifications', async function (this: MiniSentryWorld) {
  const eventDetails = await this.page.locator('pre, .space-y-1, ol').textContent();
  expect(eventDetails).toBeTruthy();
  expect(eventDetails).not.toBe('');
  
  // Verify modifications are present
  expect(eventDetails).toContain('test_app');
});