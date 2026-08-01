---
type: Engineering Guide
title: Source map and safe change guide
description: A practical map of the myTaxiCrm Helper codebase, validation commands, and recent repository direction for engineers changing integration workflows.
tags: [engineering, source-map, testing, git-history]
---

# Source map and safe change guide

Use this page to locate an ownership area, choose a proportionate validation path, and avoid reviving retired behavior. The [architecture overview](../architecture/overview.md) describes how these directories compose into one process.

## Source map

| Path | Responsibility | When changing it |
| --- | --- | --- |
| `app.mjs` | Runtime composition and job-group registration | Check startup ordering and whether API/cron workload effects are intended. |
| `src/api/` | Express app, middleware, HTTP routes, generic PG access | Review parent router mounting and authorization as well as controller logic. |
| `src/remonline/` | RemOnline API client, cron jobs, loaders, Prisma queries | Preserve pagination, retries, throttling, watermark, and transaction semantics. |
| `src/web.api/` | MyTaxiCRM/Web API jobs, driver controls, GDC and inflow/outflow reporting | Validate business thresholds, source SQL, dates, and provider-side effects. |
| `src/bitrix/` | Bitrix automation, job scheduling, CRM workflows, Prisma persistence | Validate record identity and idempotency against realistic data. |
| `src/bq/` and `src/sql/` | BigQuery loaders and report source SQL | Treat date ranges and delete/reload behavior as data-change logic. |
| `src/sheets/` | Spreadsheet configuration/exclusions | Trace settings through their downstream consumer before changing data shape. |
| `prisma/` | RemOnline and Bitrix schemas plus migrations | Generate clients and apply the matching migration in a safe database. |
| `migrations/` | Legacy SQLite migrations | Validate against a disposable SQLite database. |
| `playground/` | Read-only PostgreSQL SQL comparison tooling | Use for query correctness/performance investigation. |

## Validation ladder

There is no conventional `npm test` suite. The package scripts mainly run targeted modules with `ENV=TEST`, so choose checks based on the impact surface.

1. **Always:** run `npm run format:check`.
2. **Prisma schema change:** run `npm run prisma:gen:all`; exercise the relevant migration against a non-production database.
3. **RemOnline loader change:** inspect the specific `test:remonline:*` script in `package.json`. `npm run test:remonline:orders` runs a bounded order-job path, but it still connects to configured infrastructure and writes sync data.
4. **Bitrix or Web API mutation:** use narrow data and explicit approval. Scripts such as branding, cash-block, referral, and driver jobs may update external records.
5. **Reporting SQL:** validate SQL with production-like parameters before loader execution. Where applicable, use `playground/`; its README describes a repeatable-read, read-only transaction that ends in rollback and supports original-versus-optimized comparisons.
6. **Route change:** verify middleware placement and test an authorized/unauthorized request path without sending production-mutating payloads.

The [operations runbook](../operations/runbook.md) explains which validation is actually enforced in CI and deployment.

## Recent history signals

Recent commits establish the current direction:

- The current merge removed the custom driver tariff and bonus feature: corresponding SQL files, Web API modules, cron jobs, bootstrap registrations, and scripts were deleted. Treat removal as intentional; search current bootstrap files, not stale references, when enumerating active jobs.
- Recent GDC mileage work changed the source relation, required non-null trip IDs, and iterated on date filtering and timezone handling. For report changes, query semantics are a first-class concern.
- The RemOnline transfer migration moved transfer/branch persistence from a BigQuery-oriented path into the RemOnline PostgreSQL schema and added related synchronization jobs. Prefer the current `src/remonline/` path for transfer changes.
- The job-board integration was removed earlier. Historical package scripts may remain as stale evidence; confirm source files and bootstrap registrations before relying on a script.

## High-value review questions

- Does this change update an external system, or only compute/report data?
- Which store owns the canonical data after this change: SQLite, generic PostgreSQL, a Prisma database, or BigQuery?
- Can a repeated run safely replace/replay the same records?
- Do source pagination, a timestamp watermark, and retries leave gaps or duplicate records?
- Is a date interpreted in the job timezone, SQL timezone, or provider timezone?
- Is route authorization enforced at the router actually mounted by `core.route.mjs`?

Answering these questions connects a local edit to the service's [scheduled workflows](../workflows/sync-and-reporting.md) and its [integration boundary](../integrations/api-and-systems.md), rather than treating the file in isolation.