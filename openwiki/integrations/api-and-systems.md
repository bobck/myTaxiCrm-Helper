---
type: Integration Reference
title: API and connected systems
description: Inbound Express routes and the external systems that myTaxiCrm Helper synchronizes, reports from, or automates.
tags: [api, integrations, express, security]
---

# API and connected systems

The Express server in `src/api/api.mjs` listens on port 3000 at `API_HOST`. `src/api/core/core.route.mjs` applies request logging, then mounts Bolt routes, the authenticated query route, referral routes, and a fallback handler. This API is one interface of the same process that registers the [scheduled workflows](../workflows/sync-and-reporting.md).

## Inbound HTTP routes

| Route | Authorization in route tree | Purpose | Source |
| --- | --- | --- | --- |
| `POST /bolt/letters/sent/1` | Bolt router authorization | Processes a Bolt letter event through driver/Bitrix logic | `src/api/modules/bolt/` |
| `POST /bolt/letters/sent/2` | Bolt router authorization | Returns a success response without additional service work | `src/api/modules/bolt/` |
| `POST /bolt/letters/approve/:letter_id` | Bolt router authorization | Sets a Bitrix approval flag | `src/api/modules/bolt/` |
| `POST /query` | `authorizationMiddleware` | Executes supplied SQL through the generic PostgreSQL pool | `src/api/modules/query/` |
| `POST /referral-add` | No middleware mounted in the referral router | Creates referral/recruit linkage | `src/api/modules/referrals/` |
| `POST /referral-validation` | No middleware mounted in the referral router | Validates referral information and performs related Bitrix work | `src/api/modules/referrals/` |
| `POST /referral-approval` | No middleware mounted in the referral router | Updates referral state and adds a CRM comment | `src/api/modules/referrals/` |

The authorization middleware accepts an `api_key` query value or raw `Authorization` header and compares it with `MYTAXICRM_HELPER_API_KEY`. The `/query` endpoint is therefore protected in the route tree, but it executes caller-provided SQL; restrict network access and credential distribution accordingly.

**Security review point:** the referral router is mounted without `authorizationMiddleware` in the inspected route tree. This wiki does not infer whether another network layer protects it. Confirm the intended boundary before exposing, changing, or relying on those endpoints.

## External-system roles

| System | Role in this repository | Main source area |
| --- | --- | --- |
| RemOnline | Service/stock operations: orders, items, cashboxes, refunds, catalog entities, assets, branches, and transfers | `src/remonline/` |
| MyTaxiCRM/Web API | Contractor/driver information, reporting inputs, and fleet-control actions | `src/web.api/` |
| Bitrix | CRM records and automation for drivers, recruiting, referrals, debt, branding, bans, and invoices | `src/bitrix/` |
| Google Sheets | Configuration and exception lists used by driver-control workflows | `src/sheets/` |
| BigQuery | Reporting destination for finance, bookkeeping, GDC, and operational reports | `src/bq/`, `src/sql/` |
| PostgreSQL | Generic API SQL pool and separate Prisma stores for RemOnline and Bitrix | `src/api/pool.mjs`, `prisma/` |
| Telegram | Notification capability exists but is not enabled in `app.mjs` | `src/telegram/` |

The [architecture overview](../architecture/overview.md) explains which persistence surface backs each integration. The [operations runbook](../operations/runbook.md) explains how the deployed process obtains configuration without exposing secret values.

## Integration change checklist

1. Identify whether the path is **read-only**, **reporting write**, or **provider/CRM mutation**. Naming it `test` does not make it safe.
2. Preserve source pagination, provider throttling, and synchronization state when modifying RemOnline loaders.
3. For a route, inspect the router and parent mounting path—not only the controller—to verify authorization and logging.
4. Keep data-store ownership explicit. Do not write a RemOnline Prisma model through the generic `pg` pool unless the schema and transaction behavior are deliberately understood.
5. Validate date, timezone, and idempotency behavior for reporting and CRM updates.

Use the [engineering change guide](../engineering/change-guide.md) for available scripts and safe validation paths.