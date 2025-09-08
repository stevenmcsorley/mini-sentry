# Mini Sentry E2E Tests

This directory contains comprehensive end-to-end tests for Mini Sentry using Playwright with BDD-style testing (Cucumber).

## 🎯 Test Strategy

Our E2E tests follow a BDD (Behavior-Driven Development) approach with:
- **Gherkin syntax** for readable test scenarios
- **Page Object Model** for maintainable UI interactions
- **Real application testing** using a dedicated test app
- **Full stack validation** from error generation to dashboard visualization

## 🏗️ Architecture

```
tests/e2e/
├── features/                     # BDD feature files (Gherkin)
├── step-definitions/             # Playwright step implementations  
├── support/                      # Test utilities and helpers
│   ├── page-objects/            # Page Object Models
│   ├── fixtures/                # Test data
│   ├── helpers/                 # Utility functions
│   ├── world.ts                 # Test world/context
│   ├── global-setup.ts          # Global test setup
│   └── global-teardown.ts       # Global test cleanup
├── reports/                     # Test reports (generated)
└── test-results/               # Test artifacts (generated)
```

## 🚀 Quick Start

### Prerequisites

1. **Mini Sentry Stack Running:**
   ```bash
   cd /home/dev/projects/sentry
   docker compose up -d
   ```

2. **Test Application Running:**
   ```bash
   # Backend (Terminal 1)
   cd tests/test-app/backend
   npm install
   npm start

   # Frontend (Terminal 2)  
   cd tests/test-app/frontend
   npm install
   npm run dev
   ```

### Install and Setup

```bash
cd tests/e2e
npm install
npm run setup
```

### Run Tests

```bash
# Run all E2E tests
npm test

# Run with visible browser (for debugging)
npm run test:headed

# Run specific feature
npm test -- --name "Project Management"

# Debug mode
npm run test:debug
```

## 📊 Test Reports

After running tests, reports are available:

```bash
# View HTML reports
open reports/cucumber-report.html
open playwright-report/index.html

# Generate and view Allure report
npm run test:report
```

## 🧪 Test Features

### Currently Implemented

#### ✅ Project Management
- Create new projects
- View project details
- Switch between projects
- Project validation and error handling
- Empty state validation

### Planned Features

#### 🔄 Event Ingestion & Error Tracking
- Generate errors from test app
- Validate event capture in Mini Sentry
- Test error grouping and fingerprinting
- Validate stack trace symbolication

#### 🔄 Dashboard Functionality  
- Test dashboard template switching
- Validate real-time data updates
- Chart interaction and filtering
- Time range selection

#### 🔄 Search and Filtering
- Advanced search syntax testing
- Time range filtering
- Event level filtering
- Environment and release filtering

#### 🔄 Release Management
- Create releases
- Upload source maps
- Test symbolicated stack traces
- Release health tracking

#### 🔄 Alert System
- Create alert rules
- Test alert triggering
- Email/webhook notifications
- Alert snoozing functionality

## 🏗️ Test Application Integration

Our tests use a dedicated e-commerce test application that:

- **Generates realistic errors** for testing error tracking
- **Provides controlled scenarios** for consistent test results
- **Integrates with Mini Sentry** using the real client
- **Runs independently** without Docker complexity

### Test Application Features

- **Error Triggers**: JavaScript errors, network failures, validation errors
- **User Workflows**: Shopping, registration, checkout with error scenarios
- **Mini Sentry Integration**: Real event capturing and session tracking
- **Test-Friendly**: All elements have `data-testid` attributes

## 📝 Writing New Tests

### 1. Create Feature File

```gherkin
# features/new-feature.feature
Feature: New Feature
  As a user
  I want to test new functionality
  So that I can ensure it works correctly

  Scenario: Basic functionality test
    Given I am on the dashboard
    When I perform some action
    Then I should see the expected result
```

### 2. Implement Step Definitions

```typescript
// step-definitions/new-feature.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { MiniSentryWorld } from '../support/world';

When('I perform some action', async function (this: MiniSentryWorld) {
  // Implementation here
});

Then('I should see the expected result', async function (this: MiniSentryWorld) {
  // Validation here
});
```

### 3. Create Page Objects (if needed)

```typescript
// support/page-objects/NewPage.ts
export class NewPage {
  constructor(private page: Page) {}

  async performAction() {
    await this.page.click('[data-testid="action-button"]');
  }
}
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the e2e directory:

```env
# Test Application
VITE_MINI_SENTRY_TOKEN=your-test-project-token
VITE_MINI_SENTRY_URL=http://localhost:8000

# Test Configuration
HEADLESS=true
BROWSER=chromium
DEFAULT_TIMEOUT=30000
```

### Playwright Configuration

Key settings in `playwright.config.ts`:

- **Browser Support**: Chromium, Firefox, Safari, Mobile
- **Parallel Execution**: Enabled for faster test runs
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Available for debugging

### Cucumber Configuration

Settings in `cucumber.config.js`:

- **Step Definitions**: Auto-discovered from `step-definitions/`
- **Report Formats**: JSON, HTML, Pretty console output
- **World Parameters**: Test environment configuration

## 🐛 Debugging

### Debug Mode

```bash
npm run test:debug
```

This runs tests with:
- Visible browser (headed mode)
- Slower execution for observation
- Console logging enabled

### Screenshots and Videos

Failed tests automatically capture:
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`  
- **Traces**: `test-results/traces/`

### Console Logging

Enable detailed logging:

```typescript
// In step definitions
console.log('Debug info:', await this.page.locator('selector').textContent());
```

### Playwright Inspector

Use Playwright's built-in debugging:

```bash
npx playwright test --debug
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Mini Sentry
        run: docker compose up -d
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd tests/e2e
          npm install
          npm run playwright:install
          
      - name: Run E2E tests
        run: |
          cd tests/e2e
          npm test
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: tests/e2e/reports/
```

## 🏆 Best Practices

### Test Design
- **Independent tests**: Each scenario should run independently
- **Realistic data**: Use realistic test data that matches production patterns
- **Clear assertions**: Make expectations explicit and descriptive
- **Error scenarios**: Test both happy path and error conditions

### Page Objects
- **Single responsibility**: Each page object handles one page/component
- **Stable selectors**: Prefer `data-testid` over CSS selectors
- **Reusable methods**: Create common actions as reusable methods
- **Wait strategies**: Use appropriate waits for dynamic content

### Test Data
- **Cleanup**: Always clean up test data after tests
- **Isolation**: Tests shouldn't depend on data from other tests
- **Fixtures**: Use fixtures for complex test data setup
- **Realistic scenarios**: Mirror real user workflows

## 🔍 Troubleshooting

### Common Issues

#### Tests Timeout
```bash
# Increase timeout in playwright.config.ts
timeout: 60000
```

#### Element Not Found
```typescript
// Use better waiting strategies
await this.page.waitForSelector('[data-testid="element"]');
await this.page.waitForLoadState('networkidle');
```

#### Flaky Tests
- Add appropriate waits for async operations
- Use stable selectors (data-testid)
- Clean up test data properly
- Check for race conditions

#### Mini Sentry Not Accessible
```bash
# Ensure stack is running
docker compose ps
docker compose up -d

# Check health endpoints
curl http://localhost:8000/api/health
curl http://localhost:5173
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Mini Sentry API Documentation](../../docs/openapi.yaml)
- [Test Application Guide](../test-app/README.md)

## 🤝 Contributing

When adding new tests:

1. Follow BDD principles with clear Given-When-Then scenarios
2. Add appropriate `data-testid` attributes to UI elements
3. Update page objects for new UI interactions
4. Include both positive and negative test cases
5. Add proper cleanup in teardown hooks
6. Document new test scenarios in this README

This E2E testing suite ensures Mini Sentry functions correctly across all features while providing valuable documentation for future development.