# Changelog

All notable changes to this project are documented here.

## 0.8.0 — 2025-09-10

### Real-time Event Streaming
- **WebSocket Integration**: Added Django Channels with Redis channel layers for real-time event streaming
- **Native WebSocket Client**: Custom React hook with robust reconnection logic and ping/pong heartbeat
- **Real-time UI Updates**: Live event feed in Logs view with toggle switch and connection status indicator
- **Chart Integration**: Real-time events automatically aggregate into time-series chart with proper bucketing
- **ASGI Server**: Migrated from WSGI to ASGI (Daphne) for WebSocket support while maintaining HTTP compatibility

### Enhanced Error Tracking
- **Numbered Error Bursts**: CDN storm app now generates numbered errors for precise delivery tracking
- **Source Map Updates**: Automated source map upload for symbolicated stack traces on CDN examples
- **Timestamp Fixes**: Resolved Invalid Date issues in real-time event display with proper ISO string conversion

### UI/UX Improvements  
- **Toggle Switch Component**: Reusable accessible toggle with "LIVE" indicator for real-time mode
- **Connection Status**: Visual feedback for WebSocket connection state with automatic reconnection
- **Event Deduplication**: Smart handling of both static and real-time events without duplicates

### Technical Infrastructure
- **Container Architecture**: Updated Docker Compose with proper ASGI configuration and dependencies
- **Memory Management**: Intelligent real-time event caching with automatic cleanup on mode toggle
- **Error Handling**: Comprehensive error boundaries and graceful fallbacks for WebSocket issues

## 0.7.0 — 2025-09-06

- Alerts: multiple targets per rule with templates (`AlertTarget`), rule edit, list by group.
- Artifacts: record `file_name` and `checksum` metadata on upload.
- Events: store raw `stack` and `symbolicated` frames; retrieve event details via `GET /api/events/{id}/`.
- Sessions: Kafka pipeline for sessions to ClickHouse and time-series query option (`backend=ch`).
- React UI: event stack viewer, rule edit and add target forms.
- README: consolidated and expanded with full feature set.

## 0.6.0 — 2025-09-06

- Alerts: per-group snooze and windowed thresholds; notify interval per group.
- Symbolication: basic JS stack parsing; per-file sourcemap selection.
- Release Health: time-series API and UI controls.

## 0.5.0 — 2025-09-06

- Alerting: email/webhook notifications, rules with thresholds and rearm windows.
- Releases/Artifacts: release model and artifact upload; symbolication stub.

## 0.4.0 — 2025-09-06

- React UI (Vite): projects, groups, events; send test events; releases and artifacts; alert rules; health views.

## 0.3.0 — 2025-09-06

- Kafka + ClickHouse: producer on ingest, Snuba-like consumer, ClickHouse events table and query endpoint.

## 0.2.0 — 2025-09-06

- Grouping: normalize + fingerprint; groups API and admin; rate limiting and retention task.

## 0.1.0 — 2025-09-06

- Initial scaffold: Django app with REST endpoints, Celery worker/beat, Postgres, Redis, Docker Compose, minimal ingest and admin.
## 0.7.1 — 2025-09-07

- Logs UI: sidebar navigation, wide layout, chart tooltip + brush selection.
- URL state: persist view/project/search/filters/time in hash.
- Server: `GET /api/events` supports `from`/`to` ISO params.
- Level handling: normalize incoming levels (warn→warning, fatal→error, etc.).
- Client: `@mini-sentry/client@0.1.1` forwards `extra.level|extra.severity` to top-level `level`.
