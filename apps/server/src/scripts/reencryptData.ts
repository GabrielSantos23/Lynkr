import "dotenv/config";
import { getDb } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { encrypt } from "../lib/encryption";
import { eq } from "drizzle-orm";

const db = getDb();

async function reencryptBookmarks() {
  const rows = await db.select().from(bookmark);

  for (const row of rows) {
    try {
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
    } catch (error) {
      console.error(`Error re-encrypting bookmark ${row.id}:`, error);
    }
  }
}

(async () => {
  try {
    await reencryptBookmarks();
  } catch (error) {
    console.error("Error during re-encryption:", error);
  } finally {
    process.exit(0);
  }
})();
