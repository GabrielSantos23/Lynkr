-- Up: add tags column to bookmark table
ALTER TABLE "bookmark" ADD COLUMN "tags" jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Down: remove tags column
ALTER TABLE "bookmark" DROP COLUMN "tags"; 