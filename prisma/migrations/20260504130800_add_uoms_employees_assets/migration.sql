-- CreateTable
CREATE TABLE "public"."uoms" (
    "id" INTEGER NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "uom_type" TEXT,
    "is_imperial" BOOLEAN,
    "is_system" BOOLEAN,
    "entity_types" TEXT[],

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" INTEGER NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "notes" TEXT,
    "phone" TEXT,
    "deleted" BOOLEAN NOT NULL,
    "position" TEXT,
    "created_at" BIGINT NOT NULL,
    "started_work" BIGINT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assets" (
    "id" INTEGER NOT NULL,
    "uid" TEXT NOT NULL,
    "title" TEXT,
    "color" TEXT,
    "state" TEXT,
    "cost" INTEGER,
    "group" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "modification" TEXT,
    "description" TEXT,
    "year" TEXT,
    "reg_number" TEXT NOT NULL,
    "owner_name" TEXT,
    "warehouse" JSONB NOT NULL,
    "address" TEXT,
    "image" TEXT,
    "custom_fields" JSONB NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);
