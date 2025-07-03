import { Hono } from "hono";
import { db } from "../db";
import { folder } from "../db/schema/bookmarks";
import { eq } from "drizzle-orm";

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
  const { userId } = c.req.query();

  // If a userId query parameter is provided, filter by it. Otherwise, return all folders.
  const result = userId
    ? await db.select().from(folder).where(eq(folder.userId, userId))
    : await db.select().from(folder);

  return c.json(result);
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
