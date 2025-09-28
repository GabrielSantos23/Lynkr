ALTER TABLE "folder" ADD COLUMN IF NOT EXISTS "slug" text;

UPDATE "folder"
SET "slug" = regexp_replace(lower(trim("name")), '\\s+', '-', 'g')
WHERE "slug" IS NULL;

ALTER TABLE "folder" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "folder_user_slug_unique"
ON "folder" ("user_id", "slug");


