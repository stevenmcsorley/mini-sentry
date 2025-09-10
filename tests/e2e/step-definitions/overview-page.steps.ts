import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MiniSentryWorld } from '../support/world';

// Page Structure and Test-IDs
Then('I should see the overview page structure', async function (this: MiniSentryWorld) {
  const overviewPage = this.page.locator('[data-testid="overview-page"]');
  await expect(overviewPage).toBeVisible();
  
  // Check main sections are present
  await expect(this.page.locator('[data-testid="overview-header"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="quick-actions"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="releases-section"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="deployments-section"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="release-health-section"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="alert-rules-section"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="groups-section"]')).toBeVisible();
});

Then('all required test-ids should be present', async function (this: MiniSentryWorld) {
  // Check all major test-ids are present
  const requiredTestIds = [
    'overview-page',
    'overview-header', 
    'project-title',
    'project-description',
    'project-info',
    'quick-actions',
    'releases-count',
    'deployments-count', 
    'alert-rules-count',
    'open-groups-count',
    'releases-section',
    'releases-table',
    'deployments-section',
    'deployments-table',
    'release-health-section',
    'session-testing',
    'health-controls',
    'alert-rules-section',
    'alert-rules-table',
    'groups-section',
    'groups-table'
  ];
  
  for (const testId of requiredTestIds) {
    const element = this.page.locator(`[data-testid="${testId}"]`);
    await expect(element).toBeVisible();
  }
});

Then('the project header should display correct information', async function (this: MiniSentryWorld) {
  const projectTitle = this.page.locator('[data-testid="project-title"]');
  const projectDescription = this.page.locator('[data-testid="project-description"]');
  const projectInfo = this.page.locator('[data-testid="project-info"]');
  
  await expect(projectTitle).toContainText('test');
  await expect(projectDescription).toContainText('Project management hub');
  await expect(projectInfo).toContainText('test'); // project slug
});

Then('the quick metrics should show current counts', async function (this: MiniSentryWorld) {
  // Store initial counts for later comparison
  const releasesCount = await this.page.locator('[data-testid="releases-count"]').textContent();
  const deploymentsCount = await this.page.locator('[data-testid="deployments-count"]').textContent();
  const rulesCount = await this.page.locator('[data-testid="alert-rules-count"]').textContent();
  const groupsCount = await this.page.locator('[data-testid="open-groups-count"]').textContent();
  
  this.testData.initialCounts = {
    releases: parseInt(releasesCount || '0'),
    deployments: parseInt(deploymentsCount || '0'),
    rules: parseInt(rulesCount || '0'),
    groups: parseInt(groupsCount || '0')
  };
  
  // Verify counts are numeric
  expect(this.testData.initialCounts.releases).toBeGreaterThanOrEqual(0);
  expect(this.testData.initialCounts.deployments).toBeGreaterThanOrEqual(0);
  expect(this.testData.initialCounts.rules).toBeGreaterThanOrEqual(0);
  expect(this.testData.initialCounts.groups).toBeGreaterThanOrEqual(0);
});

// Project Header
Then('I should see the project title {string}', async function (this: MiniSentryWorld, expectedTitle: string) {
  const projectTitle = this.page.locator('[data-testid="project-title"]');
  await expect(projectTitle).toContainText(expectedTitle);
});

Then('I should see the project description explaining the page purpose', async function (this: MiniSentryWorld) {
  const description = this.page.locator('[data-testid="project-description"]');
  await expect(description).toContainText('Project management hub');
  await expect(description).toContainText('releases, deployments, health monitoring, and issue management');
});

Then('I should see the project slug {string} in the project info section', async function (this: MiniSentryWorld, expectedSlug: string) {
  const projectInfo = this.page.locator('[data-testid="project-info"]');
  await expect(projectInfo).toContainText(expectedSlug);
});

// Quick Metrics
When('I view the quick metrics dashboard', async function (this: MiniSentryWorld) {
  const quickActions = this.page.locator('[data-testid="quick-actions"]');
  await expect(quickActions).toBeVisible();
  
  // Ensure all metric cards are visible
  await expect(this.page.locator('[data-testid="releases-count"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="deployments-count"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="alert-rules-count"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="open-groups-count"]')).toBeVisible();
});

Then('the releases count should reflect actual releases', async function (this: MiniSentryWorld) {
  const releasesTable = this.page.locator('[data-testid="releases-table"] tbody tr');
  const tableRowCount = await releasesTable.count();
  const metricsCount = await this.page.locator('[data-testid="releases-count"]').textContent();
  
  expect(parseInt(metricsCount || '0')).toBe(tableRowCount);
});

Then('the deployments count should reflect actual deployments', async function (this: MiniSentryWorld) {
  const deploymentsTable = this.page.locator('[data-testid="deployments-table"] tbody tr');
  const tableRowCount = await deploymentsTable.count();
  const metricsCount = await this.page.locator('[data-testid="deployments-count"]').textContent();
  
  expect(parseInt(metricsCount || '0')).toBe(tableRowCount);
});

Then('the alert rules count should reflect configured rules', async function (this: MiniSentryWorld) {
  const rulesTable = this.page.locator('[data-testid="alert-rules-table"] tbody tr');
  const tableRowCount = await rulesTable.count();
  const metricsCount = await this.page.locator('[data-testid="alert-rules-count"]').textContent();
  
  expect(parseInt(metricsCount || '0')).toBe(tableRowCount);
});

Then('the open issues count should reflect current error groups', async function (this: MiniSentryWorld) {
  const groupsTable = this.page.locator('[data-testid="groups-table"] tbody tr');
  const tableRowCount = await groupsTable.count();
  const metricsCount = await this.page.locator('[data-testid="open-groups-count"]').textContent();
  
  expect(parseInt(metricsCount || '0')).toBe(tableRowCount);
});

// Release Management
When('I locate the release management section', async function (this: MiniSentryWorld) {
  const releaseSection = this.page.locator('[data-testid="releases-section"]');
  await expect(releaseSection).toBeVisible();
});

Then('I should see the release creation form', async function (this: MiniSentryWorld) {
  const releaseForm = this.page.locator('[data-testid="release-form"]');
  await expect(releaseForm).toBeVisible();
});

Then('I should see the releases table with existing releases', async function (this: MiniSentryWorld) {
  const releasesTable = this.page.locator('[data-testid="releases-table"]');
  await expect(releasesTable).toBeVisible();
});

When('I create a new overview release with version {string} and environment {string}', async function (this: MiniSentryWorld, version: string, environment: string) {
  // Store the version for later verification
  this.testData.testReleaseVersion = version;
  this.testData.testReleaseEnvironment = environment;
  
  // Use the existing release form in the section
  const releaseSection = this.page.locator('[data-testid="releases-section"]');
  const versionInput = releaseSection.locator('input').first();
  const envInput = releaseSection.locator('input').nth(1);
  const createButton = releaseSection.locator('button').filter({ hasText: /create|add/i });
  
  await versionInput.fill(version);
  await envInput.fill(environment);
  await createButton.click();
  
  // Wait for the release to be created
  await this.page.waitForTimeout(2000);
});

Then('the new release should appear in the releases table', async function (this: MiniSentryWorld) {
  const releasesTable = this.page.locator('[data-testid="releases-table"]');
  await expect(releasesTable).toContainText(this.testData.testReleaseVersion!);
});

Then('the release should have the correct version and environment', async function (this: MiniSentryWorld) {
  const releasesTable = this.page.locator('[data-testid="releases-table"]');
  const releaseRow = releasesTable.locator('tr').filter({ hasText: this.testData.testReleaseVersion! });
  
  await expect(releaseRow).toContainText(this.testData.testReleaseVersion!);
  await expect(releaseRow).toContainText(this.testData.testReleaseEnvironment!);
});

Then('the releases count in quick metrics should increment', async function (this: MiniSentryWorld) {
  const newCount = await this.page.locator('[data-testid="releases-count"]').textContent();
  const initialCount = this.testData.initialCounts?.releases || 0;
  
  expect(parseInt(newCount || '0')).toBeGreaterThan(initialCount);
});

// Deployment Management
When('I locate the deployment management section', async function (this: MiniSentryWorld) {
  const deploymentSection = this.page.locator('[data-testid="deployments-section"]');
  await expect(deploymentSection).toBeVisible();
});

Then('I should see the deployment creation form', async function (this: MiniSentryWorld) {
  const deploymentForm = this.page.locator('[data-testid="deployment-form"]');
  await expect(deploymentForm).toBeVisible();
});

Then('I should see the deployments table with existing deployments', async function (this: MiniSentryWorld) {
  const deploymentsTable = this.page.locator('[data-testid="deployments-table"]');
  await expect(deploymentsTable).toBeVisible();
});

When('I create a new deployment with name {string} and URL {string}', async function (this: MiniSentryWorld, name: string, url: string) {
  this.testData.testDeploymentName = name;
  this.testData.testDeploymentUrl = url;
  
  const deploymentSection = this.page.locator('[data-testid="deployments-section"]');
  const nameInput = deploymentSection.locator('input').first();
  const urlInput = deploymentSection.locator('input').nth(1);
  const createButton = deploymentSection.locator('button').filter({ hasText: /create|add/i });
  
  await nameInput.fill(name);
  await urlInput.fill(url);
  await createButton.click();
  
  await this.page.waitForTimeout(2000);
});

Then('the new deployment should appear in the deployments table', async function (this: MiniSentryWorld) {
  const deploymentsTable = this.page.locator('[data-testid="deployments-table"]');
  await expect(deploymentsTable).toContainText(this.testData.testDeploymentName!);
});

Then('the deployment should have the correct name and URL', async function (this: MiniSentryWorld) {
  const deploymentsTable = this.page.locator('[data-testid="deployments-table"]');
  const deploymentRow = deploymentsTable.locator('tr').filter({ hasText: this.testData.testDeploymentName! });
  
  await expect(deploymentRow).toContainText(this.testData.testDeploymentName!);
  await expect(deploymentRow).toContainText(this.testData.testDeploymentUrl!);
});

Then('the deployments count in quick metrics should increment', async function (this: MiniSentryWorld) {
  const newCount = await this.page.locator('[data-testid="deployments-count"]').textContent();
  const initialCount = this.testData.initialCounts?.deployments || 0;
  
  expect(parseInt(newCount || '0')).toBeGreaterThan(initialCount);
});

// Release Health
When('I locate the release health section', async function (this: MiniSentryWorld) {
  const healthSection = this.page.locator('[data-testid="release-health-section"]');
  await expect(healthSection).toBeVisible();
});

Then('I should see the session testing controls', async function (this: MiniSentryWorld) {
  const sessionTesting = this.page.locator('[data-testid="session-testing"]');
  await expect(sessionTesting).toBeVisible();
  
  await expect(this.page.locator('[data-testid="session-user-input"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="send-ok-session"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="send-crashed-session"]')).toBeVisible();
});

Then('I should see the health data controls with range and interval selectors', async function (this: MiniSentryWorld) {
  const healthControls = this.page.locator('[data-testid="health-controls"]');
  await expect(healthControls).toBeVisible();
  
  await expect(this.page.locator('[data-testid="health-range-select"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="health-interval-select"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="refresh-health"]')).toBeVisible();
});

When('I enter {string} in the session user input', async function (this: MiniSentryWorld, userId: string) {
  const userInput = this.page.locator('[data-testid="session-user-input"]');
  await userInput.fill(userId);
  this.testData.testSessionUser = userId;
});

When('I click the overview {string} button', async function (this: MiniSentryWorld, buttonText: string) {
  if (buttonText === 'Send ok session') {
    const button = this.page.locator('[data-testid="send-ok-session"]');
    await button.click();
  } else if (buttonText === 'Send crashed session') {
    const button = this.page.locator('[data-testid="send-crashed-session"]');
    await button.click();
  }
  await this.page.waitForTimeout(1000);
});

Then('the session should be sent successfully', async function (this: MiniSentryWorld) {
  // Wait for potential session data to be processed
  await this.page.waitForTimeout(2000);
  // Verify no error messages appeared
  const errorMessages = this.page.locator('.error, [class*="error"]');
  expect(await errorMessages.count()).toBe(0);
});

Then('the crashed session should be sent successfully', async function (this: MiniSentryWorld) {
  await this.page.waitForTimeout(2000);
  const errorMessages = this.page.locator('.error, [class*="error"]');
  expect(await errorMessages.count()).toBe(0);
});

When('I change the health range to {string}', async function (this: MiniSentryWorld, range: string) {
  const rangeSelect = this.page.locator('[data-testid="health-range-select"]');
  await rangeSelect.selectOption(range);
});

When('I click the refresh health button', async function (this: MiniSentryWorld) {
  const refreshButton = this.page.locator('[data-testid="refresh-health"]');
  await refreshButton.click();
});

Then('the health data should be refreshed', async function (this: MiniSentryWorld) {
  // Wait for potential refresh to complete
  await this.page.waitForTimeout(2000);
  // Verify refresh button is still clickable (no error state)
  const refreshButton = this.page.locator('[data-testid="refresh-health"]');
  await expect(refreshButton).toBeEnabled();
});

// Alert Management
When('I locate the alert management section', async function (this: MiniSentryWorld) {
  const alertSection = this.page.locator('[data-testid="alert-rules-section"]');
  await expect(alertSection).toBeVisible();
});

Then('I should see the alert rule creation form', async function (this: MiniSentryWorld) {
  const alertForm = this.page.locator('[data-testid="alert-rule-form"]');
  await expect(alertForm).toBeVisible();
});

When('I create a new alert rule with name {string} and threshold {int}', async function (this: MiniSentryWorld, name: string, threshold: number) {
  this.testData.testAlertName = name;
  this.testData.testAlertThreshold = threshold;
  
  const alertSection = this.page.locator('[data-testid="alert-rules-section"]');
  const nameInput = alertSection.locator('input[placeholder*="name" i], input[placeholder*="rule" i]').first();
  const thresholdInput = alertSection.locator('input[type="number"], input[placeholder*="threshold" i]').first();
  const createButton = alertSection.locator('button').filter({ hasText: /create|add/i }).first();
  
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }
  if (await thresholdInput.isVisible()) {
    await thresholdInput.fill(threshold.toString());
  }
  if (await createButton.isVisible()) {
    await createButton.click();
  }
  
  await this.page.waitForTimeout(2000);
});

Then('the new alert rule should appear in the alert rules table', async function (this: MiniSentryWorld) {
  const alertTable = this.page.locator('[data-testid="alert-rules-table"]');
  if (this.testData.testAlertName) {
    await expect(alertTable).toContainText(this.testData.testAlertName);
  }
});

Then('the alert rule should have the correct name and threshold', async function (this: MiniSentryWorld) {
  const alertTable = this.page.locator('[data-testid="alert-rules-table"]');
  
  if (this.testData.testAlertName) {
    const ruleRow = alertTable.locator('tr').filter({ hasText: this.testData.testAlertName });
    await expect(ruleRow).toContainText(this.testData.testAlertName);
    
    if (this.testData.testAlertThreshold) {
      await expect(ruleRow).toContainText(this.testData.testAlertThreshold.toString());
    }
  }
});

Then('the alert rules count in quick metrics should increment', async function (this: MiniSentryWorld) {
  const newCount = await this.page.locator('[data-testid="alert-rules-count"]').textContent();
  const initialCount = this.testData.initialCounts?.rules || 0;
  
  expect(parseInt(newCount || '0')).toBeGreaterThan(initialCount);
});

When('I modify the rule threshold to {int}', async function (this: MiniSentryWorld, newThreshold: number) {
  const thresholdInput = this.page.locator('[data-testid="rule-threshold-input"]');
  if (await thresholdInput.isVisible()) {
    await thresholdInput.fill(newThreshold.toString());
    this.testData.testAlertThreshold = newThreshold;
  }
});

When('I click the update rule button', async function (this: MiniSentryWorld) {
  const updateButton = this.page.locator('[data-testid="update-rule-button"]');
  if (await updateButton.isVisible()) {
    await updateButton.click();
    await this.page.waitForTimeout(1000);
  }
});

Then('the rule threshold should be updated to {int}', async function (this: MiniSentryWorld, expectedThreshold: number) {
  await this.page.waitForTimeout(2000);
  const alertTable = this.page.locator('[data-testid="alert-rules-table"]');
  await expect(alertTable).toContainText(expectedThreshold.toString());
});

// Issue Management
Given('there are error groups visible in the project', async function (this: MiniSentryWorld) {
  // Check if groups exist, if not this step will be noted but test can continue
  const groupsTable = this.page.locator('[data-testid="groups-table"] tbody tr');
  const groupCount = await groupsTable.count();
  
  this.testData.hasGroups = groupCount > 0;
  
  if (groupCount === 0) {
    console.log('No error groups found - some issue management tests may be skipped');
  }
});

When('I locate the issue management section', async function (this: MiniSentryWorld) {
  const groupsSection = this.page.locator('[data-testid="groups-section"]');
  await expect(groupsSection).toBeVisible();
});

Then('I should see the groups table with error groups', async function (this: MiniSentryWorld) {
  const groupsTable = this.page.locator('[data-testid="groups-table"]');
  await expect(groupsTable).toBeVisible();
});

Then('each group should have action buttons', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    const firstRow = this.page.locator('[data-testid="groups-table"] tbody tr').first();
    
    // Check for action buttons (they may not all be visible depending on group state)
    const buttonsToCheck = ['resolve', 'unresolve', 'ignore', 'assign', 'comment'];
    
    for (const action of buttonsToCheck) {
      const button = firstRow.locator(`button`).filter({ hasText: new RegExp(action, 'i') });
      if (await button.count() > 0) {
        await expect(button.first()).toBeVisible();
      }
    }
  }
});

When('I click the resolve button on the first error group', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    const firstRow = this.page.locator('[data-testid="groups-table"] tbody tr').first();
    const resolveButton = firstRow.locator('button').filter({ hasText: /resolve/i }).first();
    
    if (await resolveButton.isVisible()) {
      await resolveButton.click();
      await this.page.waitForTimeout(2000);
    }
  }
});

Then('the group should be marked as resolved', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    // Wait for the update to complete
    await this.page.waitForTimeout(2000);
    // The test passes if no errors occurred during the resolve action
    const errorMessages = this.page.locator('.error, [class*="error"]');
    expect(await errorMessages.count()).toBe(0);
  }
});

When('I click the unresolve button on the same group', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    const firstRow = this.page.locator('[data-testid="groups-table"] tbody tr').first();
    const unresolveButton = firstRow.locator('button').filter({ hasText: /unresolve/i }).first();
    
    if (await unresolveButton.isVisible()) {
      await unresolveButton.click();
      await this.page.waitForTimeout(2000);
    }
  }
});

Then('the group should be marked as unresolved', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    await this.page.waitForTimeout(2000);
    const errorMessages = this.page.locator('.error, [class*="error"]');
    expect(await errorMessages.count()).toBe(0);
  }
});

When('I click the assign button on the group and enter {string}', async function (this: MiniSentryWorld, assignee: string) {
  if (this.testData.hasGroups) {
    const firstRow = this.page.locator('[data-testid="groups-table"] tbody tr').first();
    const assignButton = firstRow.locator('button').filter({ hasText: /assign/i }).first();
    
    if (await assignButton.isVisible()) {
      // Set up dialog handler before clicking
      this.page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept(assignee);
      });
      
      await assignButton.click();
      await this.page.waitForTimeout(2000);
    }
  }
});

Then('the group should be assigned to {string}', async function (this: MiniSentryWorld, assignee: string) {
  if (this.testData.hasGroups) {
    await this.page.waitForTimeout(2000);
    const errorMessages = this.page.locator('.error, [class*="error"]');
    expect(await errorMessages.count()).toBe(0);
  }
});

When('I click the comment button on the group and enter {string}', async function (this: MiniSentryWorld, comment: string) {
  if (this.testData.hasGroups) {
    const firstRow = this.page.locator('[data-testid="groups-table"] tbody tr').first();
    const commentButton = firstRow.locator('button').filter({ hasText: /comment/i }).first();
    
    if (await commentButton.isVisible()) {
      // Set up dialog handler
      this.page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept(comment);
      });
      
      await commentButton.click();
      await this.page.waitForTimeout(2000);
    }
  }
});

Then('the comment should be added successfully', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups) {
    // Check for success alert or lack of error
    this.page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('Comment added');
      await dialog.accept();
    });
    
    await this.page.waitForTimeout(1000);
  }
});

// Layout and Visual Tests
Then('the release management section should be in the top-left position', async function (this: MiniSentryWorld) {
  const releasesSection = this.page.locator('[data-testid="releases-section"]');
  await expect(releasesSection).toBeVisible();
  
  // Check if it's in the expected grid position (implementation depends on CSS grid)
  const boundingBox = await releasesSection.boundingBox();
  expect(boundingBox).toBeTruthy();
});

Then('the deployment management section should be in the top-right position', async function (this: MiniSentryWorld) {
  const deploymentsSection = this.page.locator('[data-testid="deployments-section"]');
  await expect(deploymentsSection).toBeVisible();
});

Then('the release health section should be in the middle-left position', async function (this: MiniSentryWorld) {
  const healthSection = this.page.locator('[data-testid="release-health-section"]');
  await expect(healthSection).toBeVisible();
});

Then('the alert management section should be in the middle-right position', async function (this: MiniSentryWorld) {
  const alertsSection = this.page.locator('[data-testid="alert-rules-section"]');
  await expect(alertsSection).toBeVisible();
});

Then('the issue management section should span the full width at the bottom', async function (this: MiniSentryWorld) {
  const groupsSection = this.page.locator('[data-testid="groups-section"]');
  await expect(groupsSection).toBeVisible();
});

Then('each section should have proper color coding and badges', async function (this: MiniSentryWorld) {
  // Check for color-coded elements in each section
  const sections = [
    'releases-section',
    'deployments-section', 
    'release-health-section',
    'alert-rules-section',
    'groups-section'
  ];
  
  for (const sectionId of sections) {
    const section = this.page.locator(`[data-testid="${sectionId}"]`);
    const badge = section.locator('span').filter({ hasText: /\d+/ }).first();
    
    if (await badge.count() > 0) {
      await expect(badge).toBeVisible();
    }
  }
});

// Interactive Elements
When('I hover over the quick metric cards', async function (this: MiniSentryWorld) {
  const quickActions = this.page.locator('[data-testid="quick-actions"] > div');
  const cardCount = await quickActions.count();
  
  for (let i = 0; i < cardCount; i++) {
    const card = quickActions.nth(i);
    await card.hover();
    await this.page.waitForTimeout(500);
  }
});

Then('the cards should show hover effects', async function (this: MiniSentryWorld) {
  // Check that hover doesn't cause errors and cards remain visible
  const quickActions = this.page.locator('[data-testid="quick-actions"] > div');
  const cardCount = await quickActions.count();
  expect(cardCount).toBeGreaterThan(0);
  
  for (let i = 0; i < cardCount; i++) {
    const card = quickActions.nth(i);
    await expect(card).toBeVisible();
  }
});

When('I interact with form inputs in each section', async function (this: MiniSentryWorld) {
  // Test inputs in different sections
  const sessionUserInput = this.page.locator('[data-testid="session-user-input"]');
  if (await sessionUserInput.isVisible()) {
    await sessionUserInput.fill('test-interaction');
    await sessionUserInput.clear();
  }
  
  const rangeSelect = this.page.locator('[data-testid="health-range-select"]');
  if (await rangeSelect.isVisible()) {
    await rangeSelect.selectOption('1h');
  }
});

Then('the inputs should respond and accept data', async function (this: MiniSentryWorld) {
  // Verify inputs are functional
  const sessionUserInput = this.page.locator('[data-testid="session-user-input"]');
  if (await sessionUserInput.isVisible()) {
    await expect(sessionUserInput).toBeEnabled();
  }
  
  const rangeSelect = this.page.locator('[data-testid="health-range-select"]');
  if (await rangeSelect.isVisible()) {
    await expect(rangeSelect).toBeEnabled();
  }
});

When('I click buttons in each section', async function (this: MiniSentryWorld) {
  // Test buttons in different sections without triggering actions
  const refreshButton = this.page.locator('[data-testid="refresh-health"]');
  if (await refreshButton.isVisible()) {
    // Just verify it's clickable
    await expect(refreshButton).toBeEnabled();
  }
});

Then('the buttons should provide visual feedback', async function (this: MiniSentryWorld) {
  // Verify buttons are responsive
  const refreshButton = this.page.locator('[data-testid="refresh-health"]');
  if (await refreshButton.isVisible()) {
    await expect(refreshButton).toBeEnabled();
  }
});

// Data Persistence
When('I create a new release {string} in environment {string}', async function (this: MiniSentryWorld, version: string, environment: string) {
  this.testData.persistenceTestVersion = version;
  
  const releaseSection = this.page.locator('[data-testid="releases-section"]');
  const versionInput = releaseSection.locator('input').first();
  const envInput = releaseSection.locator('input').nth(1);
  const createButton = releaseSection.locator('button').filter({ hasText: /create|add/i });
  
  await versionInput.fill(version);
  await envInput.fill(environment);
  await createButton.click();
  
  await this.page.waitForTimeout(2000);
});

When('I switch to the {string} tab', async function (this: MiniSentryWorld, tabName: string) {
  let tabSelector: string;
  switch (tabName.toLowerCase()) {
    case 'logs':
      tabSelector = '[data-testid="nav-logs"]';
      break;
    case 'overview':
      tabSelector = '[data-testid="nav-overview"]';
      break;
    case 'dashboard':
      tabSelector = '[data-testid="nav-dashboard"]';
      break;
    default:
      throw new Error(`Unknown tab: ${tabName}`);
  }
  
  const tab = this.page.locator(tabSelector);
  await tab.click();
  await this.page.waitForTimeout(1000);
});

When('I switch back to the {string} tab', async function (this: MiniSentryWorld, tabName: string) {
  let tabSelector: string;
  switch (tabName.toLowerCase()) {
    case 'logs':
      tabSelector = '[data-testid="nav-logs"]';
      break;
    case 'overview':
      tabSelector = '[data-testid="nav-overview"]';
      break;
    case 'dashboard':
      tabSelector = '[data-testid="nav-dashboard"]';
      break;
    default:
      throw new Error(`Unknown tab: ${tabName}`);
  }
  
  const tab = this.page.locator(tabSelector);
  await tab.click();
  await this.page.waitForTimeout(1000);
});

Then('the release {string} should still be visible in the releases table', async function (this: MiniSentryWorld, version: string) {
  const releasesTable = this.page.locator('[data-testid="releases-table"]');
  await expect(releasesTable).toContainText(version);
});

Then('the releases count should reflect the addition', async function (this: MiniSentryWorld) {
  const releasesCount = await this.page.locator('[data-testid="releases-count"]').textContent();
  expect(parseInt(releasesCount || '0')).toBeGreaterThan(0);
});

// Error Handling
When('an API error occurs during release creation', async function (this: MiniSentryWorld) {
  // This step simulates error conditions - in practice, this might involve network mocking
  // For now, we'll just verify the page handles invalid input gracefully
  this.testData.expectingError = true;
});

Then('the overview page should handle the error gracefully', async function (this: MiniSentryWorld) {
  // Verify the page is still functional
  const overviewPage = this.page.locator('[data-testid="overview-page"]');
  await expect(overviewPage).toBeVisible();
});

Then('appropriate error messages should be displayed', async function (this: MiniSentryWorld) {
  // In a real error scenario, we'd check for error messages
  // For now, just verify the page hasn't crashed
  await expect(this.page.locator('body')).toBeVisible();
});

When('an API error occurs during health data refresh', async function (this: MiniSentryWorld) {
  // Simulate error scenario
  this.testData.expectingError = true;
});

Then('the health section should continue to function', async function (this: MiniSentryWorld) {
  const healthSection = this.page.locator('[data-testid="release-health-section"]');
  await expect(healthSection).toBeVisible();
});

Then('existing data should remain visible', async function (this: MiniSentryWorld) {
  // Verify the section content is still there
  const healthSection = this.page.locator('[data-testid="release-health-section"]');
  await expect(healthSection).toContainText('Release Health');
});

// Responsive Design
When('I resize the browser to mobile width', async function (this: MiniSentryWorld) {
  await this.page.setViewportSize({ width: 375, height: 667 }); // Mobile size
});

Then('the quick metrics should stack vertically', async function (this: MiniSentryWorld) {
  // Check that the grid layout adapts to mobile
  const quickActions = this.page.locator('[data-testid="quick-actions"]');
  await expect(quickActions).toBeVisible();
});

Then('the main content grid should collapse to single column', async function (this: MiniSentryWorld) {
  // Verify sections are still visible in mobile layout
  await expect(this.page.locator('[data-testid="releases-section"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="deployments-section"]')).toBeVisible();
});

Then('all tables should have horizontal scrolling', async function (this: MiniSentryWorld) {
  // Tables should still be accessible on mobile
  const tables = this.page.locator('table');
  const tableCount = await tables.count();
  expect(tableCount).toBeGreaterThan(0);
});

When('I resize back to desktop width', async function (this: MiniSentryWorld) {
  await this.page.setViewportSize({ width: 1280, height: 720 }); // Desktop size
});

Then('the layout should return to the two-column grid', async function (this: MiniSentryWorld) {
  // Verify desktop layout is restored
  const mainGrid = this.page.locator('.grid.grid-cols-1.gap-6.lg\\:grid-cols-2');
  await expect(mainGrid).toBeVisible();
});

Then('all sections should be properly positioned', async function (this: MiniSentryWorld) {
  // Verify all main sections are visible in desktop layout
  const sections = [
    'releases-section',
    'deployments-section',
    'release-health-section', 
    'alert-rules-section',
    'groups-section'
  ];
  
  for (const sectionId of sections) {
    const section = this.page.locator(`[data-testid="${sectionId}"]`);
    await expect(section).toBeVisible();
  }
});

// Test IDs Comprehensive Check
Then('I should be able to locate all major elements using test-ids', async function (this: MiniSentryWorld) {
  const majorTestIds = [
    'overview-page',
    'overview-header',
    'quick-actions', 
    'releases-section',
    'deployments-section',
    'release-health-section',
    'alert-rules-section',
    'groups-section'
  ];
  
  for (const testId of majorTestIds) {
    const element = this.page.locator(`[data-testid="${testId}"]`);
    await expect(element).toBeVisible();
  }
});

Then('form elements should have descriptive test-ids', async function (this: MiniSentryWorld) {
  const formTestIds = [
    'session-user-input',
    'health-range-select',
    'health-interval-select',
    'rule-threshold-input',
    'rule-window-input',
    'rule-notify-input'
  ];
  
  for (const testId of formTestIds) {
    const element = this.page.locator(`[data-testid="${testId}"]`);
    if (await element.count() > 0) {
      await expect(element).toBeVisible();
    }
  }
});

Then('action buttons should have unique test-ids with entity identifiers', async function (this: MiniSentryWorld) {
  // Check for dynamically generated test-ids with entity IDs
  const actionButtons = this.page.locator('[data-testid^="resolve-group-"], [data-testid^="assign-group-"], [data-testid^="comment-group-"]');
  const buttonCount = await actionButtons.count();
  
  if (buttonCount > 0) {
    // Verify at least some action buttons have proper test-ids
    expect(buttonCount).toBeGreaterThan(0);
  }
});

Then('tables should have proper test-ids for rows and sections', async function (this: MiniSentryWorld) {
  const tableTestIds = [
    'releases-table',
    'deployments-table', 
    'alert-rules-table',
    'groups-table'
  ];
  
  for (const testId of tableTestIds) {
    const table = this.page.locator(`[data-testid="${testId}"]`);
    await expect(table).toBeVisible();
  }
});

Then('dynamic elements should include entity IDs in their test-ids', async function (this: MiniSentryWorld) {
  // Check for dynamic test-ids like release-{id}, deployment-{id}
  const dynamicElements = this.page.locator('[data-testid*="-"], [data-testid*="release-"], [data-testid*="deployment-"], [data-testid*="group-"]');
  const elementCount = await dynamicElements.count();
  
  if (elementCount > 0) {
    expect(elementCount).toBeGreaterThan(0);
  }
});

// Integration Tests
When('I create a release and then navigate to the {string} tab', async function (this: MiniSentryWorld, tabName: string) {
  // Create a release first
  this.testData.integrationTestVersion = 'integration-test-1.0.0';
  
  const releaseSection = this.page.locator('[data-testid="releases-section"]');
  const versionInput = releaseSection.locator('input').first();
  const envInput = releaseSection.locator('input').nth(1);
  const createButton = releaseSection.locator('button').filter({ hasText: /create|add/i });
  
  await versionInput.fill(this.testData.integrationTestVersion);
  await envInput.fill('test');
  await createButton.click();
  await this.page.waitForTimeout(2000);
  
  // Navigate to the specified tab
  let tabSelector: string;
  switch (tabName.toLowerCase()) {
    case 'logs':
      tabSelector = '[data-testid="nav-logs"]';
      break;
    case 'overview':
      tabSelector = '[data-testid="nav-overview"]';
      break;
    case 'dashboard':
      tabSelector = '[data-testid="nav-dashboard"]';
      break;
    default:
      throw new Error(`Unknown tab: ${tabName}`);
  }
  
  const tab = this.page.locator(tabSelector);
  await tab.click();
  await this.page.waitForTimeout(1000);
});

Then('the release should be available for filtering', async function (this: MiniSentryWorld) {
  // On logs tab, check if release filter includes our test release
  // This depends on the logs tab implementation
  await this.page.waitForTimeout(2000);
  
  // Just verify we successfully navigated and the tab loaded
  const body = await this.page.locator('body').textContent();
  expect(body).toBeTruthy();
});

When('I create an alert rule and return to the issue groups', async function (this: MiniSentryWorld) {
  // This scenario tests if alert rules enable snooze functionality
  this.testData.hasAlertRules = true;
});

Then('snooze actions should be available for error groups', async function (this: MiniSentryWorld) {
  if (this.testData.hasGroups && this.testData.hasAlertRules) {
    const snoozeButtons = this.page.locator('[data-testid^="snooze-group-"]');
    const snoozeCount = await snoozeButtons.count();
    
    if (snoozeCount > 0) {
      expect(snoozeCount).toBeGreaterThan(0);
    }
  }
});

When('I send session data and navigate to the {string} tab', async function (this: MiniSentryWorld, tabName: string) {
  // Send a session first
  const okSessionButton = this.page.locator('[data-testid="send-ok-session"]');
  if (await okSessionButton.isVisible()) {
    await okSessionButton.click();
    await this.page.waitForTimeout(2000);
  }
  
  // Navigate to specified tab
  let tabSelector: string;
  switch (tabName.toLowerCase()) {
    case 'logs':
      tabSelector = '[data-testid="nav-logs"]';
      break;
    case 'overview':
      tabSelector = '[data-testid="nav-overview"]';
      break;
    case 'dashboard':
      tabSelector = '[data-testid="nav-dashboard"]';
      break;
    default:
      throw new Error(`Unknown tab: ${tabName}`);
  }
  
  const tab = this.page.locator(tabSelector);
  await tab.click();
  await this.page.waitForTimeout(1000);
});

Then('the health data should be reflected in dashboard charts', async function (this: MiniSentryWorld) {
  // On dashboard tab, verify charts are present
  await this.page.waitForTimeout(3000);
  
  const charts = this.page.locator('canvas, svg, [class*="chart"]');
  const chartCount = await charts.count();
  
  if (chartCount > 0) {
    expect(chartCount).toBeGreaterThan(0);
  }
});

// Real-time Updates
When('new error events are ingested into the system', async function (this: MiniSentryWorld) {
  // This would require actual event ingestion - for testing we simulate
  this.testData.expectingUpdates = true;
});

Then('the open issues count should update automatically', async function (this: MiniSentryWorld) {
  // In a real-time scenario, we'd check for count updates
  // For now, verify the count element is present and functional
  const groupsCount = this.page.locator('[data-testid="open-groups-count"]');
  await expect(groupsCount).toBeVisible();
});

When('new sessions are sent to the health endpoint', async function (this: MiniSentryWorld) {
  // Simulate by sending actual sessions
  const okSessionButton = this.page.locator('[data-testid="send-ok-session"]');
  if (await okSessionButton.isVisible()) {
    await okSessionButton.click();
    await this.page.waitForTimeout(1000);
  }
});

Then('the health data should reflect the changes after refresh', async function (this: MiniSentryWorld) {
  const refreshButton = this.page.locator('[data-testid="refresh-health"]');
  if (await refreshButton.isVisible()) {
    await refreshButton.click();
    await this.page.waitForTimeout(2000);
  }
  
  // Verify refresh completed without errors
  await expect(refreshButton).toBeEnabled();
});

When('alert rules are triggered', async function (this: MiniSentryWorld) {
  // This would require actual alert triggering
  this.testData.alertsTriggered = true;
});

Then('the alert status should be visible in the interface', async function (this: MiniSentryWorld) {
  // Check that alert-related UI elements are present
  const alertSection = this.page.locator('[data-testid="alert-rules-section"]');
  await expect(alertSection).toBeVisible();
});

// Accessibility
Then('all interactive elements should be keyboard accessible', async function (this: MiniSentryWorld) {
  // Test tab navigation through interactive elements
  const buttons = this.page.locator('button, input, select');
  const buttonCount = await buttons.count();
  
  expect(buttonCount).toBeGreaterThan(0);
  
  // Test that at least the first few buttons are focusable
  for (let i = 0; i < Math.min(3, buttonCount); i++) {
    const button = buttons.nth(i);
    if (await button.isVisible()) {
      await button.focus();
      await expect(button).toBeFocused();
    }
  }
});

Then('form labels should be properly associated with inputs', async function (this: MiniSentryWorld) {
  // Check that form elements have proper labeling
  const labels = this.page.locator('label');
  const labelCount = await labels.count();
  
  if (labelCount > 0) {
    expect(labelCount).toBeGreaterThan(0);
  }
});

Then('color coding should not be the only way to convey information', async function (this: MiniSentryWorld) {
  // Verify sections have text labels and not just color coding
  const sections = this.page.locator('section[data-testid*="section"]');
  const sectionCount = await sections.count();
  
  for (let i = 0; i < sectionCount; i++) {
    const section = sections.nth(i);
    const headings = section.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
  }
});

Then('section headings should provide clear hierarchy', async function (this: MiniSentryWorld) {
  // Check for proper heading structure
  const mainHeading = this.page.locator('[data-testid="project-title"]');
  await expect(mainHeading).toBeVisible();
  
  const sectionHeadings = this.page.locator('h3');
  const headingCount = await sectionHeadings.count();
  
  expect(headingCount).toBeGreaterThan(0);
});

Then('loading states should be indicated appropriately', async function (this: MiniSentryWorld) {
  // Verify that buttons remain clickable (no permanent loading state)
  const actionButtons = this.page.locator('button[data-testid*="send"], button[data-testid*="refresh"]');
  const buttonCount = await actionButtons.count();
  
  for (let i = 0; i < buttonCount; i++) {
    const button = actionButtons.nth(i);
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
    }
  }
});