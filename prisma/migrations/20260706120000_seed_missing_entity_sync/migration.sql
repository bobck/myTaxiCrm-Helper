INSERT INTO "public"."entity_sync" ("entity_name", "sync_details", "updated_at") VALUES
    ('Order', '{}'::jsonb, CURRENT_TIMESTAMP),
    ('OrderItem', '{}'::jsonb, CURRENT_TIMESTAMP),
    ('Transfer', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("entity_name") DO NOTHING;
