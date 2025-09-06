# Changelog

All notable changes to this project are documented here.

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
