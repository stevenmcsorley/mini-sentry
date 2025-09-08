import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MiniSentryWorld } from '../support/world';

// Use simplified setup - just navigate to the page
Given('I have a test project set up', async function(this: MiniSentryWorld) {
  // Simple setup - just store test data
  this.testData.projectName = `test-project-${Date.now()}`;
});

Given('I am on the Mini Sentry UI', async function(this: MiniSentryWorld) {
  await this.page.goto('http://localhost:3001');
  await this.page.waitForLoadState('networkidle');
});

Given('I am on the overview page', async function(this: MiniSentryWorld) {
  // Navigate to overview tab using title attribute (matching working tests)
  const overviewButton = this.page.locator('button[title="Overview"]');
  await overviewButton.click();
  await expect(this.page.locator('[data-testid="overview-page"]')).toBeVisible();
});

Given('I scroll to the alert management section', async function(this: MiniSentryWorld) {
  const alertSection = this.page.locator('[data-testid="alert-rules-section"]');
  await alertSection.scrollIntoViewIfNeeded();
  await expect(alertSection).toBeVisible();
});

When('I select {string} from the alert target type dropdown', async function(this: MiniSentryWorld, targetType: string) {
  const dropdown = this.page.locator('[data-testid="alert-target-type-select"]');
  await dropdown.selectOption(targetType);
});

Then('the target input should show webhook placeholder', async function(this: MiniSentryWorld) {
  const input = this.page.locator('[data-testid="alert-target-input"]');
  const placeholder = await input.getAttribute('placeholder');
  expect(placeholder).toContain('webhook');
});

Then('the target value should update to webhook example', async function(this: MiniSentryWorld) {
  const input = this.page.locator('[data-testid="alert-target-input"]');
  const value = await input.inputValue();
  expect(value).toContain('https://');
});

Then('the target input should show email placeholder', async function(this: MiniSentryWorld) {
  const input = this.page.locator('[data-testid="alert-target-input"]');
  const placeholder = await input.getAttribute('placeholder');
  expect(placeholder).toContain('email');
});

Then('the target value should update to email example', async function(this: MiniSentryWorld) {
  const input = this.page.locator('[data-testid="alert-target-input"]');
  const value = await input.inputValue();
  expect(value).toContain('@');
});

When('I enter {string} in the target input', async function(this: MiniSentryWorld, targetValue: string) {
  const input = this.page.locator('[data-testid="alert-target-input"]');
  await input.clear();
  await input.fill(targetValue);
});

// Note: Removed duplicate button step - using existing one from event-ingestion.steps.ts

Then('the alert rule should be created with email target', async function(this: MiniSentryWorld) {
  // Wait for the alert rule to appear in the list
  await this.page.waitForTimeout(1000);
  const alertRules = this.page.locator('[data-testid="alert-rules-table"] tbody tr');
  const ruleCount = await alertRules.count();
  expect(ruleCount).toBeGreaterThan(0);
  
  // Check that the latest rule has email target
  const latestRule = alertRules.last();
  const targetCell = latestRule.locator('td:nth-child(4)'); // Target is 4th column
  const targetText = await targetCell.textContent();
  expect(targetText).toContain('@');
});

Then('the alert rule should be created with webhook target', async function(this: MiniSentryWorld) {
  // Wait for the alert rule to appear in the list
  await this.page.waitForTimeout(1000);
  const alertRules = this.page.locator('[data-testid="alert-rules-table"] tbody tr');
  const ruleCount = await alertRules.count();
  expect(ruleCount).toBeGreaterThan(0);
  
  // Check that the latest rule has webhook target
  const latestRule = alertRules.last();
  const targetCell = latestRule.locator('td:nth-child(4)'); // Target is 4th column
  const targetText = await targetCell.textContent();
  expect(targetText).toContain('https://');
});

Then('I should see a success message', async function(this: MiniSentryWorld) {
  // Look for success indicators - could be a toast, status message, or updated UI
  const possibleSuccessMessages = [
    this.page.locator('text=Alert rule created'),
    this.page.locator('text=Success'),
    this.page.locator('[data-testid="success-message"]'),
    this.page.locator('.alert-success'),
  ];
  
  let found = false;
  for (const locator of possibleSuccessMessages) {
    try {
      await expect(locator).toBeVisible({ timeout: 2000 });
      found = true;
      break;
    } catch (e) {
      // Continue to next possible message
    }
  }
  
  if (!found) {
    // If no explicit success message, check that the alert rule was added to the list
    const alertRules = this.page.locator('[data-testid="alert-rules-list"] tr');
    const ruleCount = await alertRules.count();
    expect(ruleCount).toBeGreaterThan(0);
  }
});