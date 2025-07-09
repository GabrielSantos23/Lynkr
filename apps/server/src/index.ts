// Conditionally load dotenv only when running in a Node.js environment (not Cloudflare Workers)
if (typeof process !== "undefined" && process?.versions?.node) {
  // Dynamically import so that the bundle doesn't include Node-only code in edge runtimes.
  await import("dotenv/config");
}

// Minimal polyfill for __dirname in runtimes (like Cloudflare) where it doesn't exist.
// This is needed for some third-party CommonJS dependencies that expect it.
// In Node ESM, __dirname is also not defined, so this won't overwrite anything there.
if (typeof globalThis.__dirname === "undefined") {
  Object.defineProperty(globalThis, "__dirname", {
    value: "/",
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

import { getAuth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { foldersRouter } from "./routers/folders";
import { bookmarksRouter } from "./routers/bookmarks";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (requestOrigin) => {
      const env = process.env.CORS_ORIGIN || "";
      const allowedOrigins = env
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

      if (allowedOrigins.includes("*")) {
        // Reflect the caller's origin when wildcard is enabled (credentials safe).
        return requestOrigin ?? "";
      }

      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }

      // Fallback to first allowed origin (or empty string) when the caller's origin isn't explicitly allowed.
      return allowedOrigins[0] || "";
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  })
);

// Add middleware to handle preflight OPTIONS requests
app.options("*", (c) => {
  return c.text("");
});

app.on(["POST", "GET"], "/api/auth/**", (c) => getAuth().handler(c.req.raw));

// folders routes
app.route("/api/folders", foldersRouter);

// bookmarks routes
app.route("/api/bookmarks", bookmarksRouter);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
