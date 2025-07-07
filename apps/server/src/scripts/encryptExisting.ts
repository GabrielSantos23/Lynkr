import "dotenv/config";
import { getDb } from "../db";
import { folder, bookmark } from "../db/schema/bookmarks";
import { encrypt, decrypt } from "../lib/encryption";
import { eq } from "drizzle-orm";

const db = getDb();

async function encryptFolders() {
  const rows = await db.select().from(folder);
  for (const row of rows) {
    try {
      // Attempt to decrypt to see if already encrypted
      await decrypt(row.name);
      // If decrypt succeeds, this row is already encrypted; skip
      continue;
    } catch {
      // Not encrypted yet; proceed
    }

    const encryptedName = await encrypt(row.name);
    const encryptedIcon = await encrypt(row.icon);

    await db
      .update(folder)
      .set({ name: encryptedName, icon: encryptedIcon })
      .where(eq(folder.id, row.id));
    console.log(`Encrypted folder ${row.id}`);
  }
}

async function encryptBookmarks() {
  const rows = await db.select().from(bookmark);
  for (const row of rows) {
    try {
      await decrypt(row.url);
      continue; // already encrypted
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
    console.log(`Encrypted bookmark ${row.id}`);
  }
}

(async () => {
  await encryptFolders();
  await encryptBookmarks();
  console.log("Encryption migration completed.");
  process.exit(0);
})();
