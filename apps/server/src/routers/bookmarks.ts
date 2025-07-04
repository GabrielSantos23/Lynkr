import { Hono } from "hono";
import { db } from "../db";
import { bookmark } from "../db/schema/bookmarks";
import { eq, sql } from "drizzle-orm";

export const bookmarksRouter = new Hono();

// Helper to build favicon URL
const getFaviconUrl = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
};

// POST /api/bookmarks  -> create bookmark
bookmarksRouter.post("/", async (c) => {
  const body = await c.req.json<{ url: string; folderId: string }>();
  const { url, folderId } = body;

  if (!url) return c.json({ message: "url is required" }, 400);
  if (!folderId) return c.json({ message: "folderId is required" }, 400);

  // Attempt to fetch metadata via Microlink (simple & fast)
  let meta: {
    title: string | null;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    description: string | null;
  } = { title: null, faviconUrl: null, ogImageUrl: null, description: null };

  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      meta = {
        title: json?.data?.title ?? null,
        faviconUrl: json?.data?.logo?.url ?? null,
        ogImageUrl: json?.data?.image?.url ?? null,
        description: json?.data?.description ?? null,
      };
    }
  } catch (err) {
    console.error("microlink fetch error", err);
  }

  // Fallbacks
  if (!meta.title) {
    const hostname = (() => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return url;
      }
    })();
    meta.title =
      hostname.split(".")[0].charAt(0).toUpperCase() +
      hostname.split(".")[0].slice(1);
  }

  if (!meta.faviconUrl) {
    meta.faviconUrl = getFaviconUrl(url);
  }

  const [newBookmark] = await db
    .insert(bookmark)
    .values({
      id: crypto.randomUUID(),
      url,
      title: meta.title ?? "", // title is non-null in schema
      faviconUrl: meta.faviconUrl,
      ogImageUrl: meta.ogImageUrl,
      description: meta.description,
      folderId,
      tags: sql`'[]'::jsonb`,
    })
    .returning();

  return c.json(newBookmark, 201);
});

// DELETE /api/bookmarks/:bookmarkId -> delete bookmark
bookmarksRouter.delete("/:bookmarkId", async (c) => {
  const { bookmarkId } = c.req.param();
  if (!bookmarkId) return c.json({ message: "bookmarkId is required" }, 400);

  await db.delete(bookmark).where(eq(bookmark.id, bookmarkId));
  return c.json({ success: true });
});

// PATCH /api/bookmarks/:bookmarkId -> update bookmark (title, folderId, isPinned)
bookmarksRouter.patch("/:bookmarkId", async (c) => {
  const { bookmarkId } = c.req.param();

  if (!bookmarkId) {
    return c.json({ message: "bookmarkId is required" }, 400);
  }

  // Parse partial body
  const values = await c.req.json<
    Partial<{
      title: string;
      folderId: string;
      isPinned: boolean;
      tags: { name: string; color: string }[];
    }>
  >();

  if (Object.keys(values).length === 0) {
    return c.json({ message: "No values to update" }, 400);
  }

  if (values.tags) {
    // Simple validation: max 4 tags, no spaces in name, max 1 word each, ensure color hex
    if (values.tags.length > 4) {
      return c.json({ message: "Max 4 tags allowed" }, 400);
    }
    for (const tag of values.tags) {
      if (!/^#?[0-9A-Fa-f]{6}$/.test(tag.color)) {
        return c.json({ message: "Invalid tag color" }, 400);
      }
      if (/\s/.test(tag.name) || tag.name.length === 0) {
        return c.json({ message: "Tag name must be one word" }, 400);
      }
    }
  }

  const [updated] = await db
    .update(bookmark)
    .set(values)
    .where(eq(bookmark.id, bookmarkId))
    .returning();

  return c.json(updated);
});
