Feature: Overview Page Comprehensive Testing
  As a developer using Mini Sentry
  I want the Overview page to provide comprehensive project management
  So that I can manage releases, deployments, health, alerts, and issues effectively

  Background:
    Given Mini Sentry is running and accessible
    And I have a test project configured with a valid token
    And I am on the Mini Sentry dashboard

  Scenario: Overview page loads with proper structure and test-ids
    Given I am on the "overview" tab
    Then I should see the overview page structure
    And all required test-ids should be present
    And the project header should display correct information
    And the quick metrics should show current counts

  Scenario: Project header displays correctly
    Given I am on the "overview" tab
    Then I should see the project title "test"
    And I should see the project description explaining the page purpose
    And I should see the project slug "test" in the project info section

  Scenario: Quick metrics dashboard shows accurate counts
    Given I am on the "overview" tab
    When I view the quick metrics dashboard
    Then the releases count should reflect actual releases
    And the deployments count should reflect actual deployments
    And the alert rules count should reflect configured rules
    And the open issues count should reflect current error groups

  Scenario: Release Management section works correctly
    Given I am on the "overview" tab
    When I locate the release management section
    Then I should see the release creation form
    And I should see the releases table with existing releases
    When I create a new release with version "overview-test-1.0.0" and environment "test"
    Then the new release should appear in the releases table
    And the release should have the correct version and environment
    And the releases count in quick metrics should increment

  Scenario: Deployment Management section works correctly
    Given I am on the "overview" tab
    When I locate the deployment management section
    Then I should see the deployment creation form
    And I should see the deployments table with existing deployments
    When I create a new deployment with name "Overview Test Deploy" and URL "https://overview-test.example.com"
    Then the new deployment should appear in the deployments table
    And the deployment should have the correct name and URL
    And the deployments count in quick metrics should increment

  Scenario: Release Health section displays and functions correctly
    Given I am on the "overview" tab
    When I locate the release health section
    Then I should see the session testing controls
    And I should see the health data controls with range and interval selectors
    When I enter "test-overview-user" in the session user input
    And I click the "Send ok session" button
    Then the session should be sent successfully
    When I click the "Send crashed session" button
    Then the crashed session should be sent successfully
    When I change the health range to "1h"
    And I click the refresh health button
    Then the health data should be refreshed

  Scenario: Alert Management section works correctly
    Given I am on the "overview" tab
    When I locate the alert management section
    Then I should see the alert rule creation form
    When I create a new alert rule with name "Overview Test Rule" and threshold 5
    Then the new alert rule should appear in the alert rules table
    And the alert rule should have the correct name and threshold
    And the alert rules count in quick metrics should increment
    When I modify the rule threshold to 10
    And I click the update rule button
    Then the rule threshold should be updated to 10

  Scenario: Issue Management section displays and functions correctly
    Given I am on the "overview" tab
    And there are error groups visible in the project
    When I locate the issue management section
    Then I should see the groups table with error groups
    And each group should have action buttons
    When I click the resolve button on the first error group
    Then the group should be marked as resolved
    When I click the unresolve button on the same group
    Then the group should be marked as unresolved
    When I click the assign button on the group and enter "test-user"
    Then the group should be assigned to "test-user"
    When I click the comment button on the group and enter "Test comment from overview"
    Then the comment should be added successfully

  Scenario: Section organization and visual hierarchy is correct
    Given I am on the "overview" tab
    Then the release management section should be in the top-left position
    And the deployment management section should be in the top-right position  
    And the release health section should be in the middle-left position
    And the alert management section should be in the middle-right position
    And the issue management section should span the full width at the bottom
    And each section should have proper color coding and badges

  Scenario: Interactive elements respond correctly
    Given I am on the "overview" tab
    When I hover over the quick metric cards
    Then the cards should show hover effects
    When I interact with form inputs in each section
    Then the inputs should respond and accept data
    When I click buttons in each section
    Then the buttons should provide visual feedback

  Scenario: Data persistence across page interactions
    Given I am on the "overview" tab
    When I create a new release "persistence-test-1.0.0" in environment "test"
    And I switch to the "logs" tab
    And I switch back to the "overview" tab
    Then the release "persistence-test-1.0.0" should still be visible in the releases table
    And the releases count should reflect the addition

  Scenario: Error handling in overview sections
    Given I am on the "overview" tab
    When an API error occurs during release creation
    Then the overview page should handle the error gracefully
    And appropriate error messages should be displayed
    When an API error occurs during health data refresh
    Then the health section should continue to function
    And existing data should remain visible

  Scenario: Responsive design and layout
    Given I am on the "overview" tab
    When I resize the browser to mobile width
    Then the quick metrics should stack vertically
    And the main content grid should collapse to single column
    And all tables should have horizontal scrolling
    When I resize back to desktop width
    Then the layout should return to the two-column grid
    And all sections should be properly positioned

  Scenario: Test-IDs are comprehensive and functional
    Given I am on the "overview" tab
    Then I should be able to locate all major elements using test-ids
    And form elements should have descriptive test-ids
    And action buttons should have unique test-ids with entity identifiers
    And tables should have proper test-ids for rows and sections
    And dynamic elements should include entity IDs in their test-ids

  Scenario: Integration with other Mini Sentry features
    Given I am on the "overview" tab
    When I create a release and then navigate to the "logs" tab
    Then the release should be available for filtering
    When I create an alert rule and return to the issue groups
    Then snooze actions should be available for error groups
    When I send session data and navigate to the "dashboard" tab
    Then the health data should be reflected in dashboard charts

  Scenario: Real-time updates and data synchronization
    Given I am on the "overview" tab
    When new error events are ingested into the system
    Then the open issues count should update automatically
    When new sessions are sent to the health endpoint
    Then the health data should reflect the changes after refresh
    When alert rules are triggered
    Then the alert status should be visible in the interface

  Scenario: Accessibility and usability
    Given I am on the "overview" tab
    Then all interactive elements should be keyboard accessible
    And form labels should be properly associated with inputs
    And color coding should not be the only way to convey information
    And section headings should provide clear hierarchy
    And loading states should be indicated appropriately