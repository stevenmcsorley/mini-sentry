Feature: Event Ingestion & Error Tracking
  As a developer using Mini Sentry
  I want to capture and track application errors
  So that I can monitor application health and debug issues

  Background:
    Given Mini Sentry is running and accessible
    And I have a test project configured with a valid token

  Scenario: Generate and capture JavaScript error
    Given I am on the test application error testing page
    When I click the "JavaScript Error" button
    Then an error should be captured by Mini Sentry
    And I should see the error in the Mini Sentry dashboard within 5 seconds
    And the error should have the correct stack trace

  Scenario: Generate and capture network error
    Given I am on the test application error testing page
    When I click the "Network Error" button
    Then a network error should be captured by Mini Sentry
    And I should see the network error in the Mini Sentry dashboard within 5 seconds
    And the error should contain network failure details

  Scenario: Generate and capture async error
    Given I am on the test application error testing page  
    When I click the "Async Error" button
    Then an async error should be captured by Mini Sentry
    And I should see the async error in the Mini Sentry dashboard within 5 seconds
    And the error should be properly attributed to the async operation

  Scenario: Generate and capture React component error
    Given I am on the test application error testing page
    When I click the "Component Error" button
    Then a React component error should be captured by Mini Sentry
    And I should see the component error in the Mini Sentry dashboard within 5 seconds
    And the error should show the component error boundary message

  Scenario: Verify error grouping by fingerprinting
    Given I am on the test application error testing page
    When I click the "JavaScript Error" button multiple times
    Then the errors should be grouped together in Mini Sentry
    And the error group should show multiple occurrences
    And the error count should increment correctly

  Scenario: Verify user context in captured errors
    Given I am on the test application with a logged in test user
    And I am on the error testing page
    When I trigger any error
    Then the captured error should include user context
    And the user ID should be "test-user-123"
    And the user email should be "testuser@example.com"

  Scenario: Verify custom tags and context
    Given I am on the test application error testing page
    When I click the "Error with Context" button
    Then the captured error should include custom tags
    And the error should have "test_app: true" tag
    And the error should have "app_version: 1.0.0-test" tag
    And the error should include the test environment context

  Scenario: Test error with additional context data
    Given I am on the test application error testing page
    When I click the "Error with Extra Data" button
    Then the captured error should include extra context data
    And the extra data should contain component information
    And the extra data should contain user action details

  Scenario: Verify release and environment tracking
    Given I am on the test application
    When I trigger any error
    Then the captured error should have release "1.0.0-test"
    And the captured error should have environment "test"
    And the error should be associated with the correct project

  Scenario: Test beforeSend hook functionality
    Given the test application has a beforeSend hook configured
    When I trigger an error
    Then the beforeSend hook should modify the error data
    And the error should contain the test metadata injected by the hook
    And the original error should still be captured with modifications