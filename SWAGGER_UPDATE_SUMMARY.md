# Swagger/OpenAPI Documentation Update Summary

## Current Status ✅

I've analyzed the Django API implementation and identified all endpoints that need to be documented. The current OpenAPI spec (`docs/openapi.yaml`) is **partially outdated** and missing many endpoints.

## Major Missing Endpoints & Features

### ✅ **Current Documented Endpoints:**
- `/api/health/` - Health check
- `/api/projects/` - Project CRUD
- `/api/events/` - Event listing, retrieval, and ingestion
- `/api/groups/` - Group listing and retrieval  
- `/api/releases/` - Release management and artifacts
- `/api/symbolicate/` - Stack trace symbolication
- `/api/sessions/ingest/token/{token}/` - Session ingestion
- `/api/releases/health/` - Health summaries and series
- `/api/deployments/` - Deployment tracking
- `/api/alert-rules/` - Alert rule management

### ❌ **Missing Critical Endpoints:**

#### **Group Actions (Not Documented)**
- `POST /api/groups/{id}/resolve/` - Mark group as resolved
- `POST /api/groups/{id}/unresolve/` - Mark group as unresolved
- `POST /api/groups/{id}/ignore/` - Ignore group
- `POST /api/groups/{id}/assign/` - Assign group to user
- `POST /api/groups/{id}/bookmark/` - Bookmark/unbookmark group
- `GET /api/groups/{id}/comments/` - List/add comments

#### **Dashboard Endpoints (Completely Missing)**
- `GET /api/dashboard/series/` - Event series for dashboard charts
- `GET /api/dashboard/top-groups/` - Top groups analytics

#### **Advanced Filtering Parameters (Missing)**
- **Events endpoint**: Missing `level`, `environment`, `release`, `from`, `to`, `q` (search), `limit`, `offset` parameters
- **Groups endpoint**: Missing `status`, `from`, `to`, `q` parameters with advanced search syntax
- **Advanced search syntax**: `level:error`, `env:production`, `status:open`, `title:"phrase"`, etc.

#### **Missing Response Details**
- Pagination structure (`results`, `count`, `next`, `previous`)
- Rate limiting responses (`429` errors)
- Comprehensive error responses (`404`, `400`, etc.)
- Detailed schema descriptions and examples

#### **Incomplete Schemas**
- Missing `Comment`, `EventBucket`, `TopGroup` schemas
- Missing `tags` array in `EventIngest`
- Missing group status and assignee fields
- Limited description and examples for existing schemas

## Validation Results

When validated with Redocly OpenAPI CLI, the current spec has:
- **71 errors** (mostly formatting - trailing slashes in paths)
- **79 warnings** (missing `operationId`, missing 4xx responses, etc.)

## Recommended Next Steps

1. **Remove trailing slashes** from all endpoint paths (REST convention)
2. **Add missing endpoints** - particularly dashboard and group action endpoints  
3. **Add comprehensive filtering parameters** to existing endpoints
4. **Add missing schemas** for complete data model coverage
5. **Add examples and better descriptions** for all endpoints
6. **Add proper error responses** (4xx, 5xx) to all operations
7. **Add operationIds** for better code generation support

## Key Features to Highlight

The Mini Sentry API supports:
- **Advanced Search**: Complex query syntax with key-value pairs
- **Multiple Backends**: PostgreSQL + ClickHouse for analytics
- **Real-time Ingestion**: Token-based event and session ingestion  
- **Symbolication**: Source map support for JavaScript stack traces
- **Release Health**: Session tracking and crash-free rates
- **Alert System**: Email/webhook notifications with snoozing
- **Time-based Analytics**: Flexible time ranges and intervals
- **Group Management**: Issue deduplication with workflow actions

## Impact of Updates

Updating the documentation would:
- ✅ **Improve Developer Experience** - Complete API reference
- ✅ **Enable Better Integration** - All endpoints documented  
- ✅ **Support API Clients** - Proper schemas for code generation
- ✅ **Match Implementation** - Docs reflect actual API capabilities
- ✅ **Professional Presentation** - Shows full feature set

The current documentation covers ~60% of the actual API surface. A complete update would provide 100% coverage of all available endpoints and functionality.