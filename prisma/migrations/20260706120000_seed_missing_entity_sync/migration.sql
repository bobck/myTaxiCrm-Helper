-- Idempotently backfill baseline entity_sync rows.
--
-- The 'Transfer' seed INSERT was appended to migration
-- 20260518102908_add_branches_and_transfers *after* that migration had already been
-- applied in some environments. Prisma never re-runs an applied migration, so those
-- environments ended up with the transfers tables but without the 'Transfer' sync row.
-- getEntitySync('Transfer') then throws P2025 (NotFoundError: No EntitySync found) on
-- every loadTransfers run.
--
-- This migration re-seeds all baseline rows and is a no-op where they already exist,
-- so it converges every environment regardless of when it applied the earlier ones.
INSERT INTO "public"."entity_sync" ("entity_name", "sync_details", "updated_at") VALUES
    ('Order', '{}'::jsonb, CURRENT_TIMESTAMP),
    ('OrderItem', '{}'::jsonb, CURRENT_TIMESTAMP),
    ('Transfer', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("entity_name") DO NOTHING;
