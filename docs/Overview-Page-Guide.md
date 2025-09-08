# Mini Sentry Overview Page Guide

## Purpose

The **Overview Page** serves as the **central project management hub** within Mini Sentry, providing a comprehensive interface for managing all aspects of a project's error monitoring, release tracking, and operational health.

## Key Differences from Other Tabs

- **Overview**: Project management hub - manage releases, deployments, health, alerts, and issues
- **Logs**: Event exploration and filtering - search and analyze individual events
- **Dashboard**: Analytics and metrics - charts, performance metrics, and visual insights  
- **Projects**: Multi-project management - create, switch between, and configure projects

## Overview Page Structure

### 1. Project Header
- **Project Title**: Current project name with clear identification
- **Project Description**: Explains the page's purpose as a management hub
- **Project Info**: Shows project slug for API/configuration reference

### 2. Quick Metrics Dashboard
Four key metric cards showing at-a-glance project health:
- **Active Releases** (Blue): Number of application versions deployed
- **Deployments** (Green): Total deployment records tracked  
- **Alert Rules** (Orange): Number of configured error thresholds
- **Open Issues** (Red): Current unresolved error groups

### 3. Main Management Sections

#### Release Management
**Purpose**: Manage application versions and source map uploads
- **Create New Releases**: Define version numbers and environments
- **Upload Artifacts**: Add source maps for error symbolication
- **Track Versions**: View all releases with creation timestamps
- **API Integration**: Uses `POST /api/releases/` and `POST /api/releases/{id}/artifacts/`

#### Deployment Tracking  
**Purpose**: Track application deployments across environments
- **Record Deployments**: Document deployment events with URLs
- **Environment Tracking**: Monitor staging, production, etc.
- **Timeline View**: See deployment history and duration
- **API Integration**: Uses `POST /api/deployments/`

#### Release Health Monitoring
**Purpose**: Monitor application stability through session data
- **Session Testing**: Send test sessions (ok/crashed) to simulate user behavior
- **Crash-Free Rates**: Track percentage of sessions without crashes
- **Time Series Analysis**: View health data over configurable time ranges
- **Health Summary**: Per-release health statistics
- **API Integration**: Uses `POST /api/sessions/ingest/token/{token}/` and `GET /api/releases/health/`

#### Alert Management
**Purpose**: Configure automated error notifications
- **Create Alert Rules**: Set error count thresholds and time windows
- **Notification Targets**: Configure email and webhook destinations
- **Rule Editing**: Modify thresholds and notification intervals
- **API Integration**: Uses `POST /api/alert-rules/` and `POST /api/alert-rules/{id}/targets/`

#### Issue Management
**Purpose**: Triage and resolve error groups
- **Group Actions**: Resolve, unresolve, ignore error groups
- **Assignment**: Assign issues to team members
- **Comments**: Add notes and collaboration comments
- **Snooze**: Temporarily silence alert notifications
- **API Integration**: Uses `POST /api/groups/{id}/{action}/` endpoints

## How to Use the Overview Page

### Getting Started
1. **Select a Project**: Use the project dropdown to choose your target project
2. **Review Metrics**: Check the quick metrics to understand current project state
3. **Navigate Sections**: Use the organized sections to manage different aspects

### Common Workflows

#### Release Deployment Workflow
1. **Create Release**: Enter version number and environment in Release Management
2. **Upload Source Maps**: Use the artifact upload for each release
3. **Record Deployment**: Document the deployment in Deployment Tracking  
4. **Monitor Health**: Use Release Health to track stability after deployment

#### Error Management Workflow
1. **Review Open Issues**: Check the Issue Management section for new errors
2. **Triage Groups**: Use Resolve/Ignore actions to manage error groups
3. **Assign Issues**: Delegate specific errors to team members
4. **Configure Alerts**: Set up automated notifications for critical errors

#### Health Monitoring Workflow
1. **Send Test Sessions**: Use the session testing tools to simulate user behavior
2. **Monitor Crash Rates**: Review crash-free percentages over time
3. **Adjust Time Ranges**: Use range/interval controls to analyze different periods
4. **Track Trends**: Compare health across different releases and environments

### Test IDs for Automation

All sections include `data-testid` attributes for automated testing:

- **Page Structure**: `overview-page`, `overview-header`, `quick-actions`
- **Sections**: `releases-section`, `deployments-section`, `release-health-section`, `alert-rules-section`, `groups-section`
- **Forms**: `release-form`, `deployment-form`, `alert-rule-form`
- **Tables**: `releases-table`, `deployments-table`, `alert-rules-table`, `groups-table`
- **Controls**: `session-user-input`, `send-ok-session`, `health-range-select`, `rule-threshold-input`
- **Actions**: `resolve-group-{id}`, `assign-group-{id}`, `snooze-group-{id}`

### API Endpoints Used

The Overview Page integrates with these key API endpoints:

- **Releases**: `GET/POST /api/releases/`, `POST /api/releases/{id}/artifacts/`
- **Deployments**: `GET/POST /api/deployments/`  
- **Health**: `POST /api/sessions/ingest/token/{token}/`, `GET /api/releases/health/`, `GET /api/releases/health/series/`
- **Alerts**: `GET/POST /api/alert-rules/`, `POST /api/alert-rules/{id}/targets/`, `POST /api/alert-rules/{id}/snooze/`
- **Groups**: `GET /api/groups/`, `POST /api/groups/{id}/{action}/`, `POST /api/groups/{id}/comments/`

## Benefits

1. **Centralized Management**: All project operations in one interface
2. **Clear Organization**: Logical grouping of related functionality
3. **Visual Clarity**: Color-coded sections and metric cards for quick understanding
4. **Comprehensive Coverage**: Covers the full Mini Sentry feature set
5. **Test-Ready**: Full test-id coverage for automated testing
6. **API-Driven**: Direct integration with all relevant backend endpoints

The Overview Page transforms Mini Sentry from a simple error viewer into a complete project management platform for application monitoring and operations.