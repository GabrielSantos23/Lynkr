import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { PoolClient } from "pg";
import { databaseService } from "./database";
import { User, DatabaseUser, DatabaseAccount, JWTPayload } from "../types";

// JWT settings
const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";
const ALGORITHM = process.env.ALGORITHM || "HS256";
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30"
);

export class AuthService {
  /**
   * Verify a password against its hash
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    // Truncate password to 72 bytes as required by bcrypt
    const truncatedPassword =
      plainPassword.length > 72
        ? plainPassword.substring(0, 72)
        : plainPassword;
    return await bcrypt.compare(truncatedPassword, hashedPassword);
  }

  /**
   * Hash a password
   */
  async getPasswordHash(password: string): Promise<string> {
    // Truncate password to 72 bytes as required by bcrypt
    const truncatedPassword =
      password.length > 72 ? password.substring(0, 72) : password;
    return await bcrypt.hash(truncatedPassword, 10);
  }

  /**
   * Create JWT access token
   */
  createAccessToken(data: { sub: string }, expiresDelta?: number): string {
    const expire = new Date();
    expire.setMinutes(
      expire.getMinutes() + (expiresDelta || ACCESS_TOKEN_EXPIRE_MINUTES)
    );

    const toEncode = {
      sub: data.sub,
      exp: Math.floor(expire.getTime() / 1000),
    };

    return jwt.sign(toEncode, SECRET_KEY, {
      algorithm: ALGORITHM as jwt.Algorithm,
    });
  }

  /**
   * Verify JWT token and return user ID
   */
  verifyToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, SECRET_KEY, {
        algorithms: [ALGORITHM as jwt.Algorithm],
      }) as JWTPayload;
      return payload.sub || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a unique user ID
   */
  generateUserId(): string {
    return uuidv4();
  }

  /**
   * Generate a unique folder ID
   */
  generateFolderId(): string {
    return uuidv4();
  }

  /**
   * Generate a unique bookmark ID
   */
  generateBookmarkId(): string {
    return uuidv4();
  }

  /**
   * Generate a URL-friendly slug from name
   */
  generateSlug(name: string): string {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[-\s]+/g, "-")
      .trim();

    // Remove leading/trailing hyphens
    return slug.replace(/^-+|-+$/g, "");
  }

  /**
   * Get user by email from database
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM "user" WHERE email = $1',
        [email]
      );

      if (result.rows.length > 0) {
        return this.mapDatabaseUserToUser(result.rows[0] as DatabaseUser);
      }
      return null;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }

  /**
   * Get user by ID from database
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await databaseService.query(
        'SELECT * FROM "user" WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        return this.mapDatabaseUserToUser(result.rows[0] as DatabaseUser);
      }
      return null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    name: string,
    email: string,
    password?: string
  ): Promise<User> {
    const userId = this.generateUserId();
    const now = new Date();

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await this.getPasswordHash(password);
    }

    return await databaseService.transaction(async (client) => {
      // Insert user
      await client.query(
        `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, name, email, false, now, now]
      );

      // Create account entry if password provided
      if (password && hashedPassword) {
        const accountId = uuidv4();
        await client.query(
          `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [accountId, userId, "credentials", userId, hashedPassword, now, now]
        );
      }

      return {
        id: userId,
        name,
        email,
        email_verified: false,
        created_at: now,
        updated_at: now,
      };
    });
  }

  /**
   * Get user password from account table
   */
  async getUserPassword(userId: string): Promise<string | null> {
    try {
      const result = await databaseService.query(
        "SELECT password FROM account WHERE user_id = $1 AND provider_id = $2",
        [userId, "credentials"]
      );

      if (result.rows.length > 0) {
        return result.rows[0].password;
      }
      return null;
    } catch (error) {
      console.error("Error getting user password:", error);
      return null;
    }
  }

  /**
   * Map database user to User type
   */
  private mapDatabaseUserToUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      email_verified: dbUser.email_verified,
      image: dbUser.image,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
