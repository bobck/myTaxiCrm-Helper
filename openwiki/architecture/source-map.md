---
type: Source Map
title: Source map and ownership boundaries
description: Practical map of the MyTaxiCRM Helper source tree for locating runtime composition, integrations, business jobs, schemas, and operations files.
tags: [architecture, source-map, maintenance]
---

# Source map and ownership boundaries

Use this page after the [architecture overview](overview.md) to find the smallest appropriate change surface. The repository is organized by external system and business job family rather than by a single application-layer hierarchy.

| Location | Owns | Start here when | Related concept |
| --- | --- | --- | --- |
| `app.mjs` | Production composition and bootstrap order | Enabling/disabling a job group or changing startup | [Runtime architecture](overview.md) |
| `src/api/` | Express app, root routing, middleware, Bolt/referral/query callbacks, source PG pool | Changing HTTP behavior or request authorization | [Runtime architecture](overview.md) |
| `src/web.api/` | MyTaxiCRM web-client helpers, driver revenue/cash controls, GDC and inflow/outflow reports | Changing driver policy or CRM-derived reporting | [Synchronization and reporting workflows](../workflows/sync-and-reporting.md) |
| `src/sql/` | SQL statements backing source-PostgreSQL reports and policies | Changing report definition or source-data selection | [Synchronization and reporting workflows](../workflows/sync-and-reporting.md) |
| `src/remonline/` | RemOnline API/token client, cron jobs, entity mapping and replication modules | Changing workshop, inventory, finance, branch, order, or transfer sync | [Synchronization and reporting workflows](../workflows/sync-and-reporting.md) |
| `src/bitrix/` | Bitrix API/client utilities and CRM workflow jobs | Changing deal/contact/recruiting/referral/debt/Bolt/branding processing | [Synchronization and reporting workflows](../workflows/sync-and-reporting.md) |
| `src/bq/` | BigQuery utilities and report publication jobs | Changing output datasets or finance/bookkeeping reports | [API and connected systems](../integrations/api-and-systems.md) |
| `src/sheets/` | Google Sheets imports and cash-block exclusion synchronization | Changing operational exception inputs | [Synchronization and reporting workflows](../workflows/sync-and-reporting.md) |
| `src/telegram/` | Room notification capability | Re-enabling or modifying notifications | [Runtime architecture](overview.md) |
| `src/shared/` | SQLite access and shared helpers | Changing legacy local-state behavior | [API and connected systems](../integrations/api-and-systems.md) |
| `prisma/schema.remonline.prisma` | RemOnline PostgreSQL models | Changing replicated RemOnline data | [API and connected systems](../integrations/api-and-systems.md) |
| `prisma/bitrix/schema.prisma` | Bitrix PostgreSQL models | Changing insurance-invoice persistence | [API and connected systems](../integrations/api-and-systems.md) |
| `migrations/` | Legacy SQLite migrations | Changing SQLite schema only | [Operations runbook](../operations/runbook.md) |
| `.github/workflows/deploy.yml` | Format check and main-branch deployment | Changing CI/deploy steps | [Operations runbook](../operations/runbook.md) |
| `scripts/tunnel-pg.mjs` | Local SSH port forward to remote PostgreSQL | Investigating remote database access | [Operations runbook](../operations/runbook.md) |

## Pattern within a domain

Most integration areas follow a loose shape:

1. `bootstrap.mjs` registers the jobs used by `app.mjs`.
2. `jobs/` defines cron timing and invokes modules.
3. `modules/` implements a workflow and may be executable under an `ENV` mode.
4. `*.utils.mjs`, `*.queries.mjs`, and `*.api.mjs` hold client, mapper, and query mechanics.

This is a convention rather than a strict framework. Before moving code, inspect imports from the domain bootstrap and the package scripts; they expose both scheduled and manually runnable entrypoints.

## Recent scope changes that affect navigation

Recent history removed two former areas rather than merely disabling them:

- Commit `8e25f0e` removed custom tariff and bonus jobs, related modules, and SQL; current Web API work should focus on the remaining revenue, report, and cash-block paths.
- Commit `4aba9b8` removed Robota.ua and Work.ua job-board integrations and their API routing; package scripts with job-board names are stale references and should not be used as supported commands.
- Commit `b831fe2` moved RemOnline branches/transfers from BigQuery-oriented handling into the RemOnline Prisma/PostgreSQL path; look under `src/remonline/` and `prisma/schema.remonline.prisma` for current behavior.

Those changes connect the source layout to the current product boundary summarized in the [quickstart](../quickstart.md) and explain why older names may still appear in scripts or historic context.

## Change checklist

- Follow data flow from job or route to module, client/query, and target store before editing a mapper or SQL file.
- If modifying a schema, identify whether it is SQLite or one of two Prisma stores; migration commands differ.
- If adding a manual command, make its environment behavior explicit and classify it in the [engineering change guide](../engineering/change-guide.md); `ENV=TEST` does not make an external mutation safe by itself.
- Keep scheduling changes close to job definitions and update the relevant workflow documentation when a cadence or dependency becomes operationally significant.
