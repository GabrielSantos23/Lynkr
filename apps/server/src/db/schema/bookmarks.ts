import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sql } from "drizzle-orm";

export const folder = pgTable("folder", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("📁"),
  allowDuplicate: boolean("allow_duplicate").notNull().default(true),
  isShared: boolean("is_shared").notNull().default(false),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    url: text("url").notNull(),
    faviconUrl: text("favicon_url"),
    ogImageUrl: text("og_image_url"),
    description: text("description"),
    title: text("title").notNull(),
    folderId: text("folder_id")
      .notNull()
      .references(() => folder.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("bookmark_folder_created_at_idx").on(t.folderId, t.createdAt),
    index("bookmark_title_idx").on(t.title),
    index("bookmark_url_idx").on(t.url),
  ]
);
