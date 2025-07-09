import "dotenv/config";
import { getDb } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { encrypt } from "../lib/encryption";
import { eq } from "drizzle-orm";

const db = getDb();

async function reencryptFolders() {
  console.log("Re-encrypting folders...");
  const rows = await db.select().from(folder);

  for (const row of rows) {
    try {
      // Re-encrypt folder data with new encryption method
      // We're using the raw values here, as they will be decrypted correctly by our compatibility layer
      const encryptedName = await encrypt(row.name);
      const encryptedIcon = await encrypt(row.icon);

      await db
        .update(folder)
        .set({ name: encryptedName, icon: encryptedIcon })
        .where(eq(folder.id, row.id));

      console.log(`Re-encrypted folder ${row.id}`);
    } catch (error) {
      console.error(`Error re-encrypting folder ${row.id}:`, error);
    }
  }
}

async function reencryptBookmarks() {
  console.log("Re-encrypting bookmarks...");
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
      console.log(`Re-encrypted bookmark ${row.id}`);
    } catch (error) {
      console.error(`Error re-encrypting bookmark ${row.id}:`, error);
    }
  }
}

(async () => {
  try {
    await reencryptFolders();
    await reencryptBookmarks();
    console.log("Re-encryption completed successfully.");
  } catch (error) {
    console.error("Error during re-encryption:", error);
  } finally {
    process.exit(0);
  }
})();
