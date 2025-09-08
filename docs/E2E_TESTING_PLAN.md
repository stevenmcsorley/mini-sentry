# End-to-End Testing Plan for Mini Sentry

## Overview

This document outlines a comprehensive E2E testing strategy for Mini Sentry using Playwright with BDD-style tests. The approach includes creating realistic test applications that generate real events, errors, and interactions to validate the complete Mini Sentry functionality.

## Testing Philosophy

### BDD (Behavior-Driven Development) Approach
- **Given-When-Then** format for clear test scenarios
- **Living documentation** that serves as both tests and feature documentation
- **Business-readable** scenarios that stakeholders can understand
- **Cucumber-style** feature files with Gherkin syntax

### Full-Stack Integration Testing
- Test the **complete user journey** from error generation to dashboard visualization
- Validate **API endpoints** through UI interactions
- Ensure **data persistence** across PostgreSQL and ClickHouse
- Test **real-time features** like alerts and dashboard updates

## Test Application Architecture

### Test App Stack
```
Test React App (Port 3001)
├── Frontend: React + Vite + TypeScript
├── Backend: Express.js API (Port 3002) 
├── Database: SQLite (local file)
├── Error Generation: Intentional bugs and scenarios
└── Mini Sentry Integration: @mini-sentry/client
```

### Why This Architecture?
- **Lightweight**: No Docker required for test app
- **Isolated**: Runs independently of main Mini Sentry stack
- **Realistic**: Simulates real-world application patterns
- **Controllable**: Can trigger specific error scenarios on demand

## Directory Structure

```
tests/
├── e2e/
│   ├── features/                     # BDD feature files
│   │   ├── project-management.feature
│   │   ├── event-ingestion.feature
│   │   ├── error-tracking.feature
│   │   ├── dashboard-functionality.feature
│   │   ├── release-management.feature
│   │   ├── alert-system.feature
│   │   └── search-and-filtering.feature
│   ├── step-definitions/             # Playwright step implementations
│   │   ├── common.steps.ts
│   │   ├── project.steps.ts
│   │   ├── events.steps.ts
│   │   ├── dashboard.steps.ts
│   │   └── alerts.steps.ts
│   ├── support/                      # Test utilities
│   │   ├── page-objects/            # Page Object Models
│   │   ├── fixtures/                # Test data
│   │   └── helpers.ts               # Common functions
│   └── playwright.config.ts         # Playwright configuration
├── test-app/                        # Realistic test application
│   ├── frontend/                    # React app that generates events
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── error-scenarios/     # Controlled error generation
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── backend/                     # Express API with SQLite
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   └── database/
│   │   ├── package.json
│   │   └── server.js
│   └── README.md                    # Test app setup instructions
└── README.md                        # E2E testing guide
```

## BDD Test Scenarios

### 1. Project Management
```gherkin
Feature: Project Management
  As a developer
  I want to manage projects in Mini Sentry
  So that I can organize my error tracking

  Scenario: Create a new project
    Given I am on the Mini Sentry dashboard
    When I click "Create Project"
    And I enter project name "E-Commerce App"
    And I enter project slug "ecommerce-app"
    And I click "Create"
    Then I should see the project "E-Commerce App" in the project list
    And the project should have a unique ingest token

  Scenario: View project details
    Given I have a project "E-Commerce App"
    When I click on the project
    Then I should see the project overview page
    And I should see the ingest token
    And I should see empty state messages for events and issues
```

### 2. Event Ingestion & Error Tracking
```gherkin
Feature: Event Ingestion and Error Tracking
  As a developer
  I want my application errors to be captured and organized
  So that I can debug issues effectively

  Background:
    Given I have a project "E-Commerce App" 
    And the test application is running
    And it's configured with the project's ingest token

  Scenario: Generate and capture JavaScript errors
    Given the test app is loaded
    When I click the "Trigger Type Error" button
    Then a new event should appear in Mini Sentry within 30 seconds
    And the event should have level "error"
    And the event should contain the stack trace

  Scenario: Group similar errors together
    Given the test app is loaded
    When I click "Trigger Type Error" 5 times
    Then I should see 1 group in the Issues tab
    And the group should show 5 events
    And the group title should be "TypeError: Cannot read property"

  Scenario: Capture different error types
    When I trigger a "Network Error"
    And I trigger a "Validation Error" 
    And I trigger a "Database Error"
    Then I should see 3 different groups in Issues
    And each group should have distinct fingerprints
```

### 3. Dashboard Functionality
```gherkin
Feature: Dashboard Templates and Visualization
  As a developer
  I want to visualize my application's health
  So that I can monitor performance and error trends

  Background:
    Given I have a project with events from the last 24 hours
    
  Scenario: Switch between dashboard templates
    Given I am on the dashboard page
    When I select "Frontend Template" from the dropdown
    Then I should see Core Web Vitals metrics
    And I should see performance-focused charts
    
    When I select "General Template" 
    Then I should see error count metrics
    And I should see issue tracking widgets
    
    When I select "Backend Template"
    Then I should see API performance metrics
    And I should see database query statistics

  Scenario: Real-time dashboard updates
    Given I am viewing the dashboard
    When the test app generates new errors
    Then the dashboard metrics should update within 60 seconds
    And the events chart should show new data points
    And the top issues widget should reflect new counts
```

### 4. Search and Filtering
```gherkin
Feature: Advanced Search and Filtering
  As a developer
  I want to search and filter events efficiently
  So that I can quickly find relevant issues

  Background:
    Given I have events with different levels, environments, and releases

  Scenario: Search events by level
    Given I am on the Events page
    When I search for "level:error"
    Then I should only see events with error level
    And the results count should match error events

  Scenario: Complex search queries
    When I search for "level:error env:production message:database"
    Then I should see only error-level events
    And only from production environment  
    And containing "database" in the message

  Scenario: Time range filtering
    When I set the time range to "Last 1 hour"
    Then I should only see events from the last hour
    And the dashboard charts should update accordingly
```

### 5. Release Management
```gherkin
Feature: Release Management and Source Maps
  As a developer
  I want to track releases and see readable stack traces
  So that I can debug issues more effectively

  Scenario: Create a release
    Given I have a project "E-Commerce App"
    When I create a release "v1.2.0" for environment "production"
    Then the release should appear in the releases list
    And it should have status "active"

  Scenario: Upload source maps
    Given I have a release "v1.2.0"
    When I upload source maps for the release
    Then the artifacts should be stored
    And the checksum should be calculated

  Scenario: Symbolicated stack traces
    Given I have a release with uploaded source maps
    When a JavaScript error occurs with that release
    Then the stack trace should show original file names
    And the stack trace should show original line numbers
```

### 6. Alert System
```gherkin
Feature: Alert System
  As a developer
  I want to be notified of critical issues
  So that I can respond quickly to problems

  Scenario: Create an email alert rule
    Given I have a project with active issues
    When I create an alert rule for "High error volume"
    And I set the threshold to 10 errors in 5 minutes
    And I set the email target to "alerts@test.com"
    Then the alert rule should be saved
    And it should be active

  Scenario: Alert triggering
    Given I have an alert rule for high error volume
    When the test app generates 15 errors in 3 minutes
    Then an alert should be triggered
    And an email should be queued for sending
    
  Scenario: Alert snoozing
    Given I have an active alert for a group
    When I snooze the alert for 1 hour
    Then no new alerts should be sent for that group
    And the snooze status should be visible in the UI
```

## Test Data Management

### Fixture Strategy
```typescript
// tests/e2e/support/fixtures/projects.ts
export const testProjects = {
  ecommerce: {
    name: "E-Commerce App",
    slug: "ecommerce-app",
    environment: "test"
  },
  blog: {
    name: "Blog Platform", 
    slug: "blog-platform",
    environment: "test"
  }
}

// tests/e2e/support/fixtures/events.ts
export const errorScenarios = {
  typeError: {
    type: "TypeError",
    message: "Cannot read property 'id' of undefined",
    level: "error"
  },
  networkError: {
    type: "NetworkError", 
    message: "Failed to fetch user data",
    level: "error"
  }
}
```

### Database Cleanup
```typescript
// Clean state between test runs
beforeEach(async () => {
  await cleanupTestProjects()
  await cleanupTestEvents() 
  await resetClickHouseData()
})
```

## Test Application Features

### Error Generation Scenarios
The test React app will include controlled error triggers:

1. **Frontend Errors**
   - Type errors (undefined properties)
   - Reference errors (undefined variables)
   - Network request failures
   - Component render errors

2. **Backend Errors**
   - API endpoint failures
   - Database connection errors
   - Validation errors
   - Authentication errors

3. **Performance Issues**
   - Slow API responses
   - Memory leaks (controlled)
   - Large payload processing
   - Concurrent request handling

### User Interaction Patterns
```typescript
// Example error trigger component
export function ErrorTriggers() {
  const triggerTypeError = () => {
    const user = null
    console.log(user.id) // Intentional TypeError
  }

  const triggerNetworkError = async () => {
    await fetch('/api/nonexistent-endpoint')
  }

  const triggerValidationError = async () => {
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' })
    })
  }

  return (
    <div>
      <button onClick={triggerTypeError}>Trigger Type Error</button>
      <button onClick={triggerNetworkError}>Trigger Network Error</button>
      <button onClick={triggerValidationError}>Trigger Validation Error</button>
    </div>
  )
}
```

## Implementation Phases

### Phase 1: Setup & Foundation
- [ ] Create test application structure
- [ ] Set up Playwright with BDD framework
- [ ] Implement basic page objects
- [ ] Create project management tests

### Phase 2: Core Functionality
- [ ] Event ingestion and error tracking tests
- [ ] Dashboard functionality tests
- [ ] Search and filtering tests
- [ ] Basic alert system tests

### Phase 3: Advanced Features
- [ ] Release management and source maps tests
- [ ] Complex alert scenarios
- [ ] Performance and load testing
- [ ] Cross-browser compatibility tests

### Phase 4: Documentation & Maintenance
- [ ] Generate living documentation from tests
- [ ] Set up CI/CD pipeline integration
- [ ] Create test maintenance guidelines
- [ ] Performance benchmarking

## Tools and Libraries

### Primary Stack
- **Playwright**: E2E testing framework with cross-browser support
- **Cucumber-js**: BDD framework for Gherkin syntax
- **TypeScript**: Type safety for test code
- **Allure**: Test reporting and documentation

### Test Application Stack
- **React + Vite**: Frontend framework
- **Express.js**: Backend API server
- **SQLite**: Lightweight database
- **@mini-sentry/client**: Mini Sentry integration

### Supporting Tools
- **Faker.js**: Realistic test data generation
- **MSW**: API mocking when needed
- **Docker Compose**: Full stack orchestration
- **GitHub Actions**: CI/CD pipeline

## Success Criteria

### Coverage Goals
- **API Endpoints**: 100% of documented endpoints tested
- **UI Components**: All major user workflows covered
- **Error Scenarios**: Comprehensive error type coverage
- **Data Flow**: Complete ingestion-to-dashboard pipeline tested

### Quality Metrics
- **Test Reliability**: < 1% flaky test rate
- **Performance**: Tests complete in < 10 minutes
- **Maintainability**: Clear, readable test scenarios
- **Documentation**: Tests serve as living documentation

## Getting Started

### Prerequisites
```bash
# Install dependencies
npm install playwright @cucumber/cucumber typescript

# Set up test database
npm run setup:test-db

# Start Mini Sentry stack
docker compose up -d

# Start test application
cd tests/test-app && npm install && npm run dev
```

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific feature
npm run test:e2e -- --grep "Project Management"

# Run with UI mode
npm run test:e2e:ui

# Generate test report
npm run test:report
```

This comprehensive E2E testing strategy will ensure Mini Sentry functions correctly across all features while providing valuable documentation for future development.