import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db";
import * as schema from "../db/schema/auth";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (authInstance) return authInstance;

  const db = getDb();
  const baseURL = process.env.BETTER_AUTH_URL || "";
  const webURL = process.env.WEB_URL || "http://localhost:3001";

  const trustedOrigins = [
    ...(process.env.CORS_ORIGIN || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    "https://zyvon-web.pages.dev",
    "http://localhost:3001",
    "http://localhost:5173",
  ];

  authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirectURI: `${baseURL}/api/auth/callback/google`,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        redirectURI: `${baseURL}/api/auth/callback/github`,
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: baseURL,
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        domain: process.env.COOKIE_DOMAIN || undefined,
        path: "/",
        partitioned: true,
      },
      sessionCookieName: "better-auth-session-token",
      sessionDataCookieName: "better-auth-session-data",
      validateCallbackURL: () => true,
    },
  });

  return authInstance;
}
