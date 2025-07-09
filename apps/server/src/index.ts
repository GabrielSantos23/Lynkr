// Load dotenv only during local Node/Bun development. Cloudflare Workers
// environment provides env vars via bindings and has a `navigator` object,
// whereas Node/Bun does not.
if (typeof navigator === "undefined") {
  await import("dotenv/config");
}

import { getAuth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { foldersRouter } from "./routers/folders";
import { bookmarksRouter } from "./routers/bookmarks";

// Ensure __dirname exists for libraries that expect it (Node commonjs pattern).
// Do this early before any imports might need it
if (typeof globalThis.__dirname === "undefined") {
  // For Cloudflare Workers, we just need a placeholder value
  // since the actual filesystem path doesn't exist in the Workers runtime
  Object.defineProperty(globalThis, "__dirname", {
    value: "/",
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

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
