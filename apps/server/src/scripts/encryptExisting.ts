import "dotenv/config";
import { getDb } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { encrypt, decrypt } from "../lib/encryption";
import { eq } from "drizzle-orm";

const db = getDb();

// Folder encryption removed - folders are now stored in plain text

async function encryptBookmarks() {
  const rows = await db.select().from(bookmark);
  for (const row of rows) {
    try {
      await decrypt(row.url);
      continue;
    } catch {}

    const updateData: any = {
      url: await encrypt(row.url),
      title: await encrypt(row.title),
    };

    if (row.faviconUrl) {
      updateData.faviconUrl = await encrypt(row.faviconUrl);
    }
    if (row.ogImageUrl) {
      updateData.ogImageUrl = await encrypt(row.ogImageUrl);
    }
    if (row.description) {
      updateData.description = await encrypt(row.description);
    }

    await db.update(bookmark).set(updateData).where(eq(bookmark.id, row.id));
  }
}

(async () => {
  await encryptBookmarks();
  process.exit(0);
})();
