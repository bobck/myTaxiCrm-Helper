-- CreateTable
CREATE TABLE "public"."entity_sync" (
    "entity_name" TEXT NOT NULL,
    "sync_details" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_sync_pkey" PRIMARY KEY ("entity_name")
);

-- Seed initial rows so jobs can read state without bootstrap branching.
INSERT INTO "public"."entity_sync" ("entity_name", "sync_details", "updated_at") VALUES
    ('Order', '{}'::jsonb, CURRENT_TIMESTAMP),
    ('OrderItem', '{}'::jsonb, CURRENT_TIMESTAMP);
