import { Hono } from "hono";
import { getDb } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { decrypt } from "../lib/encryption";

export const foldersRouter = new Hono();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

foldersRouter.post("/", async (c) => {
  const db = getDb();
  const { name, icon, userId } = await c.req.json<{
    name: string;
    icon: string;
    userId?: string;
  }>();

  if (!name) {
    return c.json({ message: "name is required" }, 400);
  }

  if (!userId) {
    return c.json({ message: "userId is required" }, 400);
  }

  const folderIcon = icon && icon.trim().length > 0 ? icon : "📁";

  const [newFolder] = await db
    .insert(folder)
    .values({
      id: crypto.randomUUID(),
      name: name,
      slug: slugify(name),
      icon: folderIcon,
      userId,
      isShared: false,
      allowDuplicate: true,
    })
    .returning();

  return c.json(newFolder, 201);
});

foldersRouter.get("/:userId", async (c) => {
  const db = getDb();
  const { userId } = c.req.param();
  const result = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, userId));

  return c.json(result);
});

foldersRouter.get("/", async (c) => {
  const db = getDb();
  const { userId, folderId } = c.req.query();

  const foldersWithCountsQuery = db
    .select({
      folder: folder,
      bookmarksCount: sql<number>`COUNT(${bookmark.id})::int`,
    })
    .from(folder)
    .leftJoin(bookmark, eq(bookmark.folderId, folder.id))
    .groupBy(folder.id);

  let result;
  if (folderId) {
    result = await foldersWithCountsQuery.where(eq(folder.id, folderId));
  } else if (userId) {
    result = await foldersWithCountsQuery.where(eq(folder.userId, userId));
  } else {
    result = await foldersWithCountsQuery;
  }

  const mapped = result.map((row: any) => ({
    ...row.folder,
    _count: { bookmarks: Number(row.bookmarksCount) },
  }));

  return c.json(mapped);
});

foldersRouter.delete("/:folderId", async (c) => {
  const db = getDb();
  const { folderId } = c.req.param();

  if (!folderId) {
    return c.json({ message: "folderId is required" }, 400);
  }

  await db.delete(folder).where(eq(folder.id, folderId));
  return c.json({ success: true });
});

foldersRouter.patch("/:folderId", async (c) => {
  const db = getDb();
  const { folderId } = c.req.param();
  const values = await c.req.json<
    Partial<{
      name: string;
      icon: string;
      allowDuplicate: boolean;
      isShared: boolean;
      slug: string;
    }>
  >();

  if (!folderId) {
    return c.json({ message: "folderId is required" }, 400);
  }

  if (Object.keys(values).length === 0) {
    return c.json({ message: "No values to update" }, 400);
  }

  const updateValues: any = { ...values };
  if (values.name && !values.slug) {
    updateValues.slug = slugify(values.name);
  }

  const [updated] = await db
    .update(folder)
    .set(updateValues)
    .where(eq(folder.id, folderId))
    .returning();

  return c.json(updated);
});

foldersRouter.get("/:folderId/bookmarks", async (c) => {
  const db = getDb();
  const { folderId } = c.req.param();
  const { page = "1", search = "" } = c.req.query();
  const pageNumber = parseInt(page as string, 10) || 1;
  const PAGE_SIZE = 20;

  const offset = (pageNumber - 1) * PAGE_SIZE;

  const searchTerm = (search as string).startsWith("#")
    ? (search as string).slice(1)
    : (search as string);

  let baseWhere;
  if (search) {
    baseWhere = and(
      eq(bookmark.folderId, folderId),
      eq(bookmark.isPinned, false),
      or(
        ilike(bookmark.title, `%${searchTerm}%`),
        ilike(sql`(${bookmark.tags}::text)`, `%${searchTerm}%`)
      )
    );
  } else {
    baseWhere = and(
      eq(bookmark.folderId, folderId),
      eq(bookmark.isPinned, false)
    );
  }

  const results = await db
    .select()
    .from(bookmark)
    .where(baseWhere)
    .orderBy(desc(bookmark.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const decryptedList = await Promise.all(results.map(decryptBookmarkRow));

  const bookmarksList = decryptedList.slice(0, PAGE_SIZE);
  const hasMore = results.length > PAGE_SIZE;

  const totalElements = await db
    .select()
    .from(bookmark)
    .where(baseWhere)
    .then((rows) => rows.length);

  return c.json({ bookmarks: bookmarksList, hasMore, totalElements });
});

foldersRouter.get("/:folderId/pinned", async (c) => {
  const db = getDb();
  const { folderId } = c.req.param();
  const { search = "" } = c.req.query();
  const searchTerm = (search as string).startsWith("#")
    ? (search as string).slice(1)
    : (search as string);

  const baseConditions = [
    eq(bookmark.folderId, folderId),
    eq(bookmark.isPinned, true),
  ];

  let whereClause;
  if (search) {
    whereClause = and(
      ...baseConditions,
      or(
        ilike(bookmark.title, `%${searchTerm}%`),
        ilike(sql`(${bookmark.tags}::text)`, `%${searchTerm}%`)
      )
    );
  } else {
    whereClause = and(...baseConditions);
  }

  const pinned = await db
    .select()
    .from(bookmark)
    .where(whereClause)
    .orderBy(desc(bookmark.createdAt));

  const decryptedPinned = await Promise.all(pinned.map(decryptBookmarkRow));

  return c.json(decryptedPinned);
});

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
