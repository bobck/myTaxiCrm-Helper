---
type: Project Guide
title: MyTaxiCRM Helper quickstart
description: Engineer entrypoint for the Node.js service that runs MyTaxiCRM automations, reporting jobs, and integrations with RemOnline, Bitrix, Google services, and PostgreSQL.
tags: [nodejs, automation, crm, operations]
---

# MyTaxiCRM Helper

This repository is a long-running Node.js operational automation service for a taxi/driver CRM environment. One process exposes a small Express API and starts in-process cron jobs that synchronize external systems, apply driver-control rules, maintain CRM workflows, and publish operational and finance reporting.

The primary runtime is `app.mjs`; it starts the API, Sheets, BigQuery, RemOnline, Web API, and Bitrix job groups. Telegram imports exist but its bootstrap is currently commented out. Start with the [architecture overview](architecture/overview.md) to understand this composition before changing a scheduled job or endpoint.

## Navigate the code wiki

- **[Architecture overview](architecture/overview.md)** — startup order, HTTP surface, scheduler groups, and data-store boundaries.
- **[Source map](architecture/source-map.md)** — where responsibility lives in `src/`, `prisma/`, migrations, and operational files.
- **[Synchronization and reporting workflows](workflows/sync-and-reporting.md)** — RemOnline replication, cash-block controls, reporting, Bitrix processes, and recent scope removals.
- **[API and connected systems](integrations/api-and-systems.md)** — HTTP routes, provider boundaries, persistence roles, and non-secret configuration expectations.
- **[Operations runbook](operations/runbook.md)** — setup, migrations, PM2 deployment, tunnel use, and incident-minded safeguards.
- **[Engineering change guide](engineering/change-guide.md)** — CI reality, live integration commands, and safe verification by change area.

## First 15 minutes

1. Read [architecture overview](architecture/overview.md), then use the [source map](architecture/source-map.md) to locate the area you will change.
2. Read the matching workflow in [synchronization and reporting workflows](workflows/sync-and-reporting.md); jobs can write to external systems and are not merely local batch code.
3. Review [API and connected systems](integrations/api-and-systems.md) before touching a client, query, schema, or migration. This service uses legacy SQLite, a source PostgreSQL pool, and two dedicated Prisma PostgreSQL targets.
4. For local startup or deployment work, follow the [operations runbook](operations/runbook.md). Do not read or commit `.env`, `token.json`, private keys, or database files.
5. Use the [engineering change guide](engineering/change-guide.md) to select checks. Many `test:*` scripts are live integration runs, not isolated tests.

## Current product boundary

The active product surface centers on driver and fleet operations: CRM reporting, driver revenue and cash-block automation, RemOnline workshop/inventory replication, and Bitrix workflow automation. The repository recently removed custom tariff/bonus automation and job-board integrations; do not restore references to those subsystems without a new product decision. The business details and migration direction are captured in [synchronization and reporting workflows](workflows/sync-and-reporting.md).

## Evidence and freshness

This initial wiki reflects the tracked `main` revision at `30f6cd30a8ee97da6975b5abbc35571ffa44cf3f`, plus the working-tree inventory at initialization. The root `readme.md` remains useful for basic SQLite and PM2 commands, but it does not cover the newer Prisma stores, scheduler inventory, API surface, or tunnel workflow; this wiki is the navigation and synthesis layer, not a replacement for source code.

## Backlog

- **Endpoint contracts and webhook consumers** — source anchor: `src/api/modules/`; deferred because request/response payload contracts must be validated with consumers, particularly for root-mounted referral routes.
- **Cron cadence catalogue** — source anchor: `src/*/jobs/*.mjs`; deferred because schedules are distributed across many job files and this first pass prioritizes ownership and safety boundaries over copying every expression.
