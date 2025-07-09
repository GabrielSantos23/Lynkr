import { Hono } from "hono";
import { getDb } from "../db";
import { bookmark } from "../db/schema/bookmarks";
import { eq, sql, and } from "drizzle-orm";
import { encrypt, decrypt } from "../lib/encryption";

export const bookmarksRouter = new Hono();

const getFaviconUrl = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
};

async function decryptBookmarkRow(row: any) {
  return {
    ...row,
    url: await decrypt(row.url),
    title: await decrypt(row.title),
    faviconUrl: row.faviconUrl ? await decrypt(row.faviconUrl) : null,
    ogImageUrl: row.ogImageUrl ? await decrypt(row.ogImageUrl) : null,
    description: row.description ? await decrypt(row.description) : null,
  };
}

bookmarksRouter.post("/", async (c) => {
  const db = getDb();
  const body = await c.req.json<{
    url: string;
    folderId: string;
    ogImageUrl?: string | null;
  }>();
  const { url, folderId, ogImageUrl } = body;

  if (!url) return c.json({ message: "url is required" }, 400);
  if (!folderId) return c.json({ message: "folderId is required" }, 400);

  const encryptedUrl = await encrypt(url);
  const duplicate = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(eq(bookmark.folderId, folderId), eq(bookmark.url, encryptedUrl)))
    .limit(1);

  if (duplicate.length > 0) {
    return c.json({ message: "Bookmark already exists" }, 409);
  }

  const id = crypto.randomUUID();

  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();
  const placeholderTitle =
    hostname.split(".")[0].charAt(0).toUpperCase() +
    hostname.split(".")[0].slice(1);
  const placeholderFavicon = getFaviconUrl(url);

  const encryptedTitle = await encrypt(placeholderTitle);
  const encryptedFavicon = placeholderFavicon
    ? await encrypt(placeholderFavicon)
    : null;

  const [newBookmark] = await db
    .insert(bookmark)
    .values({
      id,
      url: encryptedUrl,
      title: encryptedTitle,
      faviconUrl: encryptedFavicon,
      folderId,
      tags: sql`'[]'::jsonb`,
      ogImageUrl: ogImageUrl ? await encrypt(ogImageUrl) : null,
    })
    .returning();

  const plainBookmark = await decryptBookmarkRow(newBookmark);

  void (async () => {
    try {
      const res = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const json = (await res.json()) as any;
        const meta = {
          title: json?.data?.title ?? null,
          faviconUrl: json?.data?.logo?.url ?? null,
          ogImageUrl: json?.data?.image?.url ?? null,
          description: json?.data?.description ?? null,
        } as const;

        const updateValues: Record<string, string | null> = {};
        if (meta.title) updateValues.title = await encrypt(meta.title);
        if (meta.faviconUrl)
          updateValues.faviconUrl = await encrypt(meta.faviconUrl);
        if (meta.ogImageUrl)
          updateValues.ogImageUrl = await encrypt(meta.ogImageUrl);
        if (meta.description)
          updateValues.description = await encrypt(meta.description);

        if (Object.keys(updateValues).length > 0) {
          await db
            .update(bookmark)
            .set(updateValues)
            .where(eq(bookmark.id, id));
        }
      }
    } catch (err) {
      console.error("Deferred metadata fetch error", err);
    }
  })();

  return c.json(plainBookmark, 201);
});

bookmarksRouter.delete("/:bookmarkId", async (c) => {
  const db = getDb();
  const { bookmarkId } = c.req.param();
  if (!bookmarkId) return c.json({ message: "bookmarkId is required" }, 400);

  await db.delete(bookmark).where(eq(bookmark.id, bookmarkId));
  return c.json({ success: true });
});

bookmarksRouter.patch("/:bookmarkId", async (c) => {
  const db = getDb();
  const { bookmarkId } = c.req.param();

  if (!bookmarkId) {
    return c.json({ message: "bookmarkId is required" }, 400);
  }

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

  const updateData: any = { ...values };
  if (updateData.title !== undefined) {
    updateData.title = await encrypt(updateData.title);
  }

  const [updated] = await db
    .update(bookmark)
    .set(updateData)
    .where(eq(bookmark.id, bookmarkId))
    .returning();

  const plainUpdated = await decryptBookmarkRow(updated);

  return c.json(plainUpdated);
});
