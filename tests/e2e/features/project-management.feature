Feature: Test Project Management
  As a developer using Mini Sentry
  I want to interact with the configured test project
  So that I can validate Mini Sentry functionality

  Background:
    Given I am on the Mini Sentry dashboard
    And I am using the configured test project

  Scenario: View test project dashboard
    Given I am on the Mini Sentry dashboard
    When I navigate to the test project
    Then I should see the test project dashboard
    And I should see the project name "test"
    And the project should be properly configured

  Scenario: Verify test project configuration
    Given I am on the Mini Sentry dashboard
    And I navigate to the test project settings
    Then I should see the correct project ID "4"
    And I should see the project name "test"
    And I should see the ingest token is configured
    
  Scenario: Switch to test project (if multiple projects exist)
    Given I am on the Mini Sentry dashboard
    When I access the project selector
    And I select the test project "test"
    Then I should be viewing the test project
    And the project selector should show "test" as selected
    And I should see test project specific data

  Scenario: View test project empty state (before errors)
    Given I am on the Mini Sentry dashboard  
    And I navigate to the test project
    And the test project has no recent errors
    Then I should see guidance for sending events
    And I should see integration instructions
    And I should see the correct ingest token for the test app

  Scenario: Verify test project after errors are sent
    Given I am on the Mini Sentry dashboard
    And I navigate to the test project
    And the test project has received some errors
    Then I should see error data in the dashboard
    And I should see charts and statistics
    And I should be able to navigate to error details

  Scenario: Test project URL and navigation
    Given I am on the Mini Sentry dashboard
    When I navigate directly to the test project URL
    Then I should see the test project dashboard
    And the browser URL should contain the project identifier
    And all project-specific navigation should work correctly

  Scenario: Verify test project is ready for error ingestion
    Given I am on the Mini Sentry dashboard
    And I navigate to the test project
    Then I should see the project is ready to receive events
    And the ingest token "t_BYTD5BscDMRPR807TJ7MdfqRjJEYHdkhr8TE-nnwA" should be available
    And the project ID should be "4"
    And I should see indicators that the project is properly configured