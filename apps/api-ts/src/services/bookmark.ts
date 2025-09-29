import { databaseService } from "./database";
import { encryptionService } from "./encryption";
import { authService } from "./auth";
import { Folder, Bookmark, FolderCreate, BookmarkCreate, Tag } from "../types";

export class BookmarkService {
  /**
   * Get all folders for a user
   */
  async getFoldersByUserId(userId: string): Promise<Folder[]> {
    try {
      const result = await databaseService.query(
        "SELECT * FROM folder WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name, // Folder names are stored in plain text
        slug: row.slug,
        icon: row.icon,
        allow_duplicate: row.allow_duplicate,
        is_shared: row.is_shared,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error("Error getting folders:", error);
      return [];
    }
  }

  /**
   * Get a specific folder by ID
   */
  async getFolderById(
    folderId: string,
    userId: string
  ): Promise<Folder | null> {
    try {
      const result = await databaseService.query(
        "SELECT * FROM folder WHERE id = $1 AND user_id = $2",
        [folderId, userId]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          name: row.name, // Folder names are stored in plain text
          slug: row.slug,
          icon: row.icon,
          allow_duplicate: row.allow_duplicate,
          is_shared: row.is_shared,
          user_id: row.user_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting folder:", error);
      return null;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    userId: string,
    name: string,
    icon: string = "📁",
    allowDuplicate: boolean = true,
    isShared: boolean = false
  ): Promise<Folder> {
    const folderId = authService.generateFolderId();
    const slug = authService.generateSlug(name);
    const now = new Date();

    // Folder names are stored in plain text

    await databaseService.query(
      `INSERT INTO folder (id, name, slug, icon, allow_duplicate, is_shared, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [folderId, name, slug, icon, allowDuplicate, isShared, userId, now, now]
    );

    return {
      id: folderId,
      name, // Return plain text name
      slug,
      icon,
      allow_duplicate: allowDuplicate,
      is_shared: isShared,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Get all bookmarks for a user
   */
  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    try {
      const result = await databaseService.query(
        `SELECT b.*, f.name as folder_name, f.slug as folder_slug
         FROM bookmark b
         JOIN folder f ON b.folder_id = f.id
         WHERE f.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      );

      return result.rows.map((row) => {
        // Decrypt bookmark data
        const title = encryptionService.decrypt(row.title);
        const url = encryptionService.decrypt(row.url);
        const description = row.description
          ? encryptionService.decrypt(row.description)
          : undefined;
        const tags = row.tags
          ? typeof row.tags === "string"
            ? JSON.parse(row.tags)
            : row.tags
          : [];

        return {
          id: row.id,
          url, // Return decrypted URL
          title, // Return decrypted title
          favicon_url: row.favicon_url || undefined,
          og_image_url: row.og_image_url || undefined,
          description, // Return decrypted description
          folder_id: row.folder_id,
          is_pinned: row.is_pinned,
          tags, // Return parsed tags
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
    } catch (error) {
      console.error("Error getting bookmarks:", error);
      return [];
    }
  }

  /**
   * Get all bookmarks for a specific folder
   */
  async getBookmarksByFolderId(
    folderId: string,
    userId: string
  ): Promise<Bookmark[]> {
    try {
      const result = await databaseService.query(
        `SELECT b.*, f.name as folder_name, f.slug as folder_slug
         FROM bookmark b
         JOIN folder f ON b.folder_id = f.id
         WHERE b.folder_id = $1 AND f.user_id = $2
         ORDER BY b.created_at DESC`,
        [folderId, userId]
      );

      return result.rows.map((row) => {
        // Decrypt bookmark data
        const title = encryptionService.decrypt(row.title);
        const url = encryptionService.decrypt(row.url);
        const description = row.description
          ? encryptionService.decrypt(row.description)
          : undefined;
        const tags = row.tags
          ? typeof row.tags === "string"
            ? JSON.parse(row.tags)
            : row.tags
          : [];

        return {
          id: row.id,
          url, // Return decrypted URL
          title, // Return decrypted title
          favicon_url: row.favicon_url || undefined,
          og_image_url: row.og_image_url || undefined,
          description, // Return decrypted description
          folder_id: row.folder_id,
          is_pinned: row.is_pinned,
          tags, // Return parsed tags
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
    } catch (error) {
      console.error("Error getting bookmarks by folder:", error);
      return [];
    }
  }

  /**
   * Get a specific bookmark by ID
   */
  async getBookmarkById(
    bookmarkId: string,
    userId: string
  ): Promise<Bookmark | null> {
    try {
      const result = await databaseService.query(
        `SELECT b.*, f.name as folder_name, f.slug as folder_slug
         FROM bookmark b
         JOIN folder f ON b.folder_id = f.id
         WHERE b.id = $1 AND f.user_id = $2`,
        [bookmarkId, userId]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        // Decrypt bookmark data
        const title = encryptionService.decrypt(row.title);
        const url = encryptionService.decrypt(row.url);
        const description = row.description
          ? encryptionService.decrypt(row.description)
          : undefined;
        const tags = row.tags
          ? typeof row.tags === "string"
            ? JSON.parse(row.tags)
            : row.tags
          : [];

        return {
          id: row.id,
          url, // Return decrypted URL
          title, // Return decrypted title
          favicon_url: row.favicon_url || undefined,
          og_image_url: row.og_image_url || undefined,
          description, // Return decrypted description
          folder_id: row.folder_id,
          is_pinned: row.is_pinned,
          tags, // Return parsed tags
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting bookmark:", error);
      return null;
    }
  }

  /**
   * Create a new bookmark
   */
  async createBookmark(
    userId: string,
    url: string,
    title: string,
    folderId: string,
    faviconUrl?: string,
    ogImageUrl?: string,
    description?: string,
    isPinned: boolean = false,
    tags: Tag[] = []
  ): Promise<Bookmark> {
    const bookmarkId = authService.generateBookmarkId();
    const now = new Date();

    // Encrypt bookmark data
    const encryptedTitle = encryptionService.encrypt(title);
    const encryptedUrl = encryptionService.encrypt(url);
    const encryptedDescription = description
      ? encryptionService.encrypt(description)
      : null;

    await databaseService.query(
      `INSERT INTO bookmark (id, url, title, favicon_url, og_image_url, description, 
                            folder_id, is_pinned, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        bookmarkId,
        encryptedUrl,
        encryptedTitle,
        faviconUrl,
        ogImageUrl,
        encryptedDescription,
        folderId,
        isPinned,
        JSON.stringify(tags),
        now,
        now,
      ]
    );

    return {
      id: bookmarkId,
      url, // Return decrypted URL
      title, // Return decrypted title
      favicon_url: faviconUrl || undefined,
      og_image_url: ogImageUrl || undefined,
      description, // Return decrypted description
      folder_id: folderId,
      is_pinned: isPinned,
      tags,
      created_at: now,
      updated_at: now,
    };
  }
}

// Export singleton instance
export const bookmarkService = new BookmarkService();
