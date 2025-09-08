Feature: API Integration Testing
  As a developer using Mini Sentry UI
  I want all API endpoints to work correctly through the UI
  So that I can fully manage my error monitoring

  Background:
    Given Mini Sentry API is running and accessible
    And I am using the configured test project
    And I am on the Mini Sentry dashboard

  Scenario: Test Core Data Retrieval APIs
    Given I am on the "logs" tab
    When I select the test project from the project dropdown
    Then the "GET /api/projects/" endpoint should be called
    And the "GET /api/events/" endpoint should be called with project filter
    And the "GET /api/groups/" endpoint should be called with project filter
    And I should see events data in the UI

  Scenario: Test Event Ingestion API through Test App
    Given I am on the test application error testing page
    When I trigger a JavaScript error
    Then the "POST /api/events/ingest/token/{token}/" endpoint should receive the event
    And I should see the new event appear in Mini Sentry within 5 seconds
    When I click on the event details
    Then the "GET /api/events/{id}/" endpoint should be called
    And I should see the event details including stack trace

  Scenario: Test Release Management APIs
    Given I am on the "overview" tab
    When I create a new release with version "test-1.0.0" and environment "test"
    Then the "POST /api/releases/" endpoint should be called
    And I should see the new release in the releases table
    When I upload an artifact for the release
    Then the "POST /api/releases/{id}/artifacts/" endpoint should be called
    And I should see the artifact uploaded successfully

  Scenario: Test Release Health APIs
    Given I am on the "overview" tab
    When I send an "ok" session
    Then the "POST /api/sessions/ingest/token/{token}/" endpoint should be called
    And the release health data should update
    When I send a "crashed" session  
    Then the crash-free percentage should decrease
    And the "GET /api/releases/health/" endpoint should return updated data
    And the "GET /api/releases/health/series/" endpoint should return time series data

  Scenario: Test Alert Rule Management APIs
    Given I am on the "overview" tab
    When I create an alert rule with name "Test Rule" and threshold 5
    Then the "POST /api/alert-rules/" endpoint should be called
    And I should see the new alert rule in the table
    When I update the alert rule threshold to 10
    Then the "PATCH /api/alert-rules/{id}/" endpoint should be called
    And I should see the updated threshold
    When I add an email target to the alert rule
    Then the "POST /api/alert-rules/{id}/targets/" endpoint should be called

  Scenario: Test Group Management APIs through UI
    Given I am on the "overview" tab
    And there are error groups visible
    When I click "Resolve" on the first error group
    Then the "POST /api/groups/{id}/resolve/" endpoint should be called
    And the group status should change to resolved
    When I click "Unresolve" on the group
    Then the "POST /api/groups/{id}/unresolve/" endpoint should be called
    When I click "Ignore" on the group
    Then the "POST /api/groups/{id}/ignore/" endpoint should be called
    When I assign the group to "test-user"
    Then the "POST /api/groups/{id}/assign/" endpoint should be called
    When I add a comment "Test comment" to the group
    Then the "POST /api/groups/{id}/comments/" endpoint should be called

  Scenario: Test Deployment Management APIs
    Given I am on the "overview" tab
    And I have at least one release created
    When I create a deployment with name "Test Deploy" and URL "https://test.example.com"
    Then the "POST /api/deployments/" endpoint should be called
    And I should see the new deployment in the deployments table

  Scenario: Test Event Filtering APIs
    Given I am on the "logs" tab
    When I filter events by level "error"
    Then the "GET /api/events/" endpoint should be called with level=error parameter
    When I filter events by environment "production"
    Then the "GET /api/events/" endpoint should be called with environment=production parameter
    When I search for events with query "test error"
    Then the "GET /api/events/" endpoint should be called with search parameter
    When I change the time range to "1h"
    Then the API calls should include time range parameters

  Scenario: Test Dashboard Chart APIs
    Given I am on the "logs" tab
    When I view the event chart
    Then the "GET /api/dashboard/series/" endpoint should be called
    And I should see time series data in the chart
    When I change the chart interval to "1h"
    Then the API should be called with the new interval parameter
    When I zoom into a specific time range on the chart
    Then the API calls should reflect the selected time range

  Scenario: Test Symbolication API
    Given I have a release with uploaded source maps
    And there are events with stack traces
    When I click on an event with a stack trace
    Then the event details should load
    And if symbolication data is not stored, the "POST /api/symbolicate/" endpoint should be called
    And I should see symbolicated stack traces with original file names and line numbers

  Scenario: Test Alert Snoozing API
    Given I have alert rules configured
    And there are error groups triggering alerts
    When I click "Snooze" on an error group
    Then the "POST /api/alert-rules/{id}/snooze/" endpoint should be called
    And the group should be marked as snoozed

  Scenario: Test Event Sending from UI
    Given I am on the "logs" tab
    When I enter a test message "UI Test Error" in the message field
    And I click "Send test event"
    Then the "POST /api/events/ingest/token/{token}/" endpoint should be called
    And I should see the test event appear in the event list within 5 seconds

  Scenario: Test Pagination APIs
    Given I am on the "logs" tab
    And there are more than 50 events
    When I change the "Rows per page" to 25
    Then the "GET /api/events/" endpoint should be called with limit=25
    When I click "Next" to go to the next page
    Then the "GET /api/events/" endpoint should be called with offset=25
    When I click "Prev" to go to the previous page
    Then the "GET /api/events/" endpoint should be called with offset=0

  Scenario: Test Project Switching API Calls
    Given there are multiple projects available
    When I switch to a different project
    Then all relevant endpoints should be called with the new project parameter:
      | Endpoint | Parameter |
      | GET /api/events/ | project={new_project_slug} |
      | GET /api/groups/ | project={new_project_slug} |
      | GET /api/releases/ | project={new_project_slug} |
      | GET /api/alert-rules/ | project={new_project_slug} |
      | GET /api/deployments/ | project={new_project_slug} |

  Scenario: Test Error Handling for API Failures
    Given I am on the Mini Sentry dashboard
    When an API endpoint returns a 500 error
    Then the UI should handle the error gracefully
    And I should see an appropriate error message
    And the UI should not crash or become unresponsive