-- Up Migration: add is_pinned column to bookmark
ALTER TABLE "bookmark" ADD COLUMN "is_pinned" boolean NOT NULL DEFAULT false;
 
-- Down Migration: remove is_pinned column
ALTER TABLE "bookmark" DROP COLUMN "is_pinned"; 