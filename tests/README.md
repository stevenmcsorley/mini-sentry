# Mini Sentry E2E Testing Suite

This directory contains comprehensive end-to-end tests for Mini Sentry using Playwright with BDD-style testing.

## Quick Start

1. **Start Mini Sentry stack:**
   ```bash
   cd /home/dev/projects/sentry
   docker compose up -d
   ```

2. **Start test application:**
   ```bash
   cd tests/test-app/frontend && npm install && npm run dev &
   cd tests/test-app/backend && npm install && npm start &
   ```

3. **Run E2E tests:**
   ```bash
   cd tests/e2e
   npm install
   npm run test
   ```

## Directory Structure

```
tests/
├── e2e/                          # Playwright BDD tests
│   ├── features/                 # Gherkin feature files
│   ├── step-definitions/         # Test implementations
│   ├── support/                  # Test utilities
│   └── playwright.config.ts      # Playwright configuration
├── test-app/                     # Realistic test application
│   ├── frontend/                 # React app (Port 3001)
│   ├── backend/                  # Express API (Port 3002)
│   └── README.md                 # Test app documentation
└── README.md                     # This file
```

## Test Application

The test application simulates a realistic e-commerce platform that generates controlled errors and events for testing Mini Sentry functionality.

### Features
- **Error Generation**: Controlled JavaScript errors, network failures, validation errors
- **User Interactions**: Shopping cart, user registration, product browsing
- **Mini Sentry Integration**: Real event capturing using `@mini-sentry/client`
- **Lightweight**: No Docker required, uses SQLite for simplicity

### Architecture
- **Frontend**: React + Vite + TypeScript (Port 3001)
- **Backend**: Express.js + SQLite (Port 3002)
- **Database**: SQLite file-based database
- **Error Monitoring**: Mini Sentry client integration

## BDD Testing Approach

Tests are written in Gherkin syntax with Given-When-Then scenarios that serve as both executable tests and living documentation.

### Example Test Scenario
```gherkin
Feature: Event Ingestion and Error Tracking

  Scenario: Generate and capture JavaScript errors
    Given the test app is loaded
    When I click the "Trigger Type Error" button
    Then a new event should appear in Mini Sentry within 30 seconds
    And the event should have level "error"
    And the event should contain the stack trace
```

## Running Tests

```bash
# Install dependencies
npm install

# Run all E2E tests
npm run test:e2e

# Run specific feature
npm run test:e2e -- --grep "Project Management"

# Run with headed browser (for debugging)
npm run test:e2e:headed

# Generate test report
npm run test:report
```

## Contributing

When adding new test scenarios:

1. Write the feature file in Gherkin syntax
2. Implement step definitions in TypeScript
3. Update page objects as needed
4. Ensure tests are reliable and maintainable
5. Add appropriate test data fixtures

See the full [E2E Testing Plan](../docs/E2E_TESTING_PLAN.md) for detailed documentation.