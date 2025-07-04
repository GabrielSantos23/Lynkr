import { Hono } from "hono";
import { db } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";

export const foldersRouter = new Hono();

// Create a folder
foldersRouter.post("/", async (c) => {
  const { name, icon, userId } = await c.req.json<{
    name: string;
    icon: string;
    userId?: string;
  }>();

  if (!name) {
    return c.json({ message: "name is required" }, 400);
  }

  if (!userId) {
    // In a real app you'd extract the user id from the auth session/JWT.
    return c.json({ message: "userId is required" }, 400);
  }

  // Use provided icon or default folder icon
  const folderIcon = icon && icon.trim().length > 0 ? icon : "📁";

  const [newFolder] = await db
    .insert(folder)
    .values({
      id: crypto.randomUUID(),
      name,
      icon: folderIcon,
      userId,
      isShared: false,
      allowDuplicate: true,
    })
    .returning();

  return c.json(newFolder, 201);
});

// List folders by user
foldersRouter.get("/:userId", async (c) => {
  const { userId } = c.req.param();
  const result = await db
    .select()
    .from(folder)
    .where(eq(folder.userId, userId));
  return c.json(result);
});

// Add route to list folders (optionally filtered by userId)
foldersRouter.get("/", async (c) => {
  const { userId, folderId } = c.req.query();

  // Build base query selecting folder columns + bookmarks count
  const foldersWithCountsQuery = db
    .select({
      folder: folder, // all columns via nested object
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

  // Flatten response: merge folder fields + _count.bookmarks
  const mapped = result.map((row: any) => ({
    ...row.folder,
    _count: { bookmarks: Number(row.bookmarksCount) },
  }));

  return c.json(mapped);
});

// Delete folder by id
foldersRouter.delete("/:folderId", async (c) => {
  const { folderId } = c.req.param();

  if (!folderId) {
    return c.json({ message: "folderId is required" }, 400);
  }

  await db.delete(folder).where(eq(folder.id, folderId));
  return c.json({ success: true });
});

// Update folder (e.g., toggle sharing, rename, icon change)
foldersRouter.patch("/:folderId", async (c) => {
  const { folderId } = c.req.param();
  const values = await c.req.json<
    Partial<{
      name: string;
      icon: string;
      allowDuplicate: boolean;
      isShared: boolean;
    }>
  >();

  if (!folderId) {
    return c.json({ message: "folderId is required" }, 400);
  }

  if (Object.keys(values).length === 0) {
    return c.json({ message: "No values to update" }, 400);
  }

  const [updated] = await db
    .update(folder)
    .set(values)
    .where(eq(folder.id, folderId))
    .returning();

  return c.json(updated);
});

// List bookmarks for a folder with pagination & search
foldersRouter.get("/:folderId/bookmarks", async (c) => {
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

  const bookmarksList = results.slice(0, PAGE_SIZE);
  const hasMore = results.length > PAGE_SIZE;

  const totalElements = await db
    .select()
    .from(bookmark)
    .where(baseWhere)
    .then((rows) => rows.length);

  return c.json({ bookmarks: bookmarksList, hasMore, totalElements });
});

// New route: List pinned bookmarks for a folder (no pagination, can add later)
foldersRouter.get("/:folderId/pinned", async (c) => {
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
    // Filter by title OR tags containing search
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

  return c.json(pinned);
});
