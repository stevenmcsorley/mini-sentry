Feature: Alert Management
  As a developer using Mini Sentry
  I want to manage alert rules with different notification targets
  So that I can be notified of issues via email or webhook

  Background:
    Given I have a test project set up
    And I am on the Mini Sentry UI

  Scenario: Switch between email and webhook alert targets
    Given I am on the overview page
    When I scroll to the alert management section
    And I select "webhook" from the alert target type dropdown
    Then the target input should show webhook placeholder
    And the target value should update to webhook example
    When I select "email" from the alert target type dropdown
    Then the target input should show email placeholder
    And the target value should update to email example

  Scenario: Create email alert rule
    Given I am on the overview page
    When I scroll to the alert management section
    And I select "email" from the alert target type dropdown
    And I enter "test-alerts@example.com" in the target input
    And I click the "Create Alert Rule" button
    Then I should see a success message
    And the alert rule should be created with email target

  Scenario: Create webhook alert rule
    Given I am on the overview page
    When I scroll to the alert management section
    And I select "webhook" from the alert target type dropdown
    And I enter "https://my-webhook.com/alerts" in the target input
    And I click the "Create Alert Rule" button
    Then I should see a success message
    And the alert rule should be created with webhook target