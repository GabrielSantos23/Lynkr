import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (cachedDb) return cachedDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL env variable not set");
  }

  const sql = neon(url);
  cachedDb = drizzle(sql);
  return cachedDb;
}
