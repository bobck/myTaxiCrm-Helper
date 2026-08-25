---
type: Operations Runbook
title: Local setup, deployment, and operational safeguards
description: Practical runbook for configuring, migrating, running, deploying, and troubleshooting MyTaxiCRM Helper without exposing credentials.
tags: [operations, deployment, migrations, pm2]
---

# Local setup, deployment, and operational safeguards

The root `readme.md` provides the original SQLite and PM2 setup sequence. This page adds the current multi-database and deployment context. It applies to the one-process runtime described in the [architecture overview](../architecture/overview.md).

## Local setup

1. Install dependencies with `npm ci` or `npm install`.
2. Copy the placeholder configuration: `cp .env.example .env`.
3. Populate approved non-versioned credentials and endpoints through the normal secure channel. Do **not** commit or display `.env`, `token.json`, SSH keys, or database files.
4. Create and migrate the legacy SQLite database if needed:

   ```sh
   node node_modules/db-migrate/bin/db-migrate db:create main
   node node_modules/db-migrate/bin/db-migrate up
   ```

5. Generate Prisma clients for the two dedicated PostgreSQL stores:

   ```sh
   npm run prisma:gen:all
   ```

6. Start the full local process:

   ```sh
   npm run dev
   ```

`npm run dev` runs `app.mjs`, therefore it starts the HTTP listener and enabled schedulers. It is not a passive development server. For API-only use, package scripts `launchAPI:dev`, `launchAPI:test`, and `launchAPI:prod` invoke `src/api/api.mjs` with explicit `ENV` and `API_HOST` values.

## Migration boundaries

There are three migration tracks; apply the right one for the changed schema:

| Changed store        | Schema/migrations                                          | Commands                                                                                                  |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Legacy SQLite        | `migrations/`, `database.json`                             | `npm run migrate:up`                                                                                      |
| RemOnline PostgreSQL | `prisma/schema.remonline.prisma`, `prisma/migrations/`     | `npm run prisma:migrate:dev:remonline` locally or `npm run prisma:migrate:deploy:remonline` in deployment |
| Bitrix PostgreSQL    | `prisma/bitrix/schema.prisma`, `prisma/bitrix/migrations/` | `npm run prisma:migrate:dev:bitrix` locally or `npm run prisma:migrate:deploy:bitrix` in deployment       |

Use `npm run prisma:migrate:deploy:all` only when both Prisma stores have deployable migration state. A migration must match the store accessed by the workflow in [API and connected systems](../integrations/api-and-systems.md); legacy SQLite migration commands do not change Prisma databases.

## PM2 and deployment

`ecosystem.config.js` defines one PM2 application, `myTaxiCrm Helper`, running `app.mjs` without watch mode and with dotenv preloaded. The original operational sequence is:

```sh
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

GitHub Actions in `.github/workflows/deploy.yml` runs `npm ci` and `npm run format:check` for pull requests and main pushes. For pushes to `main`, the deployment job SSHes to the server, then runs, in order:

```sh
npm ci
npm run migrate:up
npm run prisma:gen:all
npm run prisma:migrate:deploy:all
pm2 restart 'myTaxiCrm Helper'
pm2 reset 'myTaxiCrm Helper'
```

A restart starts all enabled job groups, so deploy timing can immediately trigger scheduled work. Confirm migrations and required credentials are available before restarting.

## Remote PostgreSQL tunnel

For authorized operator troubleshooting, use:

```sh
npm run tunnel:pg
```

`scripts/tunnel-pg.mjs` launches SSH local forwarding and passes SIGINT/SIGTERM to the child process. It requires `SSH_PRIVATE_KEY_PATH`, `SSH_USER`, `SSH_HOST`, `LOCAL_PG_PORT`, `REMOTE_PG_HOST`, and `REMOTE_PG_PORT`. The last three port variables are required by the script but are not listed in the inspected `.env.example`; obtain approved values rather than inventing them.

## Operational safeguards and recovery questions

- **Schedulers are in-process.** There is no inspected durable queue, distributed lock, or health endpoint. The order loader has process-local overlap protection; other jobs may need an explicit idempotency/retry review.
- **Backfills require cursor awareness.** RemOnline `EntitySync` and Bitrix `SyncMetadata` are high-water marks. Changing, clearing, or replaying them can duplicate or skip operational work; plan the rollback and validation set first.
- **Treat manual commands as live.** Many commands labelled `test:*` call external systems and can write state. Use the [engineering change guide](../engineering/change-guide.md) before running them.
- **Review API exposure.** `/query` executes submitted SQL against the source pool, and referral routes lack visible route-local authorization. Confirm caller restrictions, upstream protection, and database privilege boundaries before deploying relevant changes.
- **Timezone is distributed.** Several cron jobs specify `Europe/Kiev`. Preserve or intentionally modernize time-zone semantics only after checking job definitions and operational reporting expectations.

## Change checklist

1. Identify the workflow and datastore through [source map](../architecture/source-map.md).
2. Apply the matching migration path and generate Prisma clients where applicable.
3. Run formatting and an authorized, narrow verification command.
4. For scheduler, cursor, policy, or external-write changes, define rollback/reconciliation before deployment.
5. Inspect PM2 logs and the first relevant scheduled execution after deployment.
