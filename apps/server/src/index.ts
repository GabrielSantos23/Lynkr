if (typeof navigator === "undefined") {
  await import("dotenv/config");
}

import { getAuth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { foldersRouter } from "./routers/folders";
import { bookmarksRouter } from "./routers/bookmarks";

if (typeof globalThis.__dirname === "undefined") {
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
        return requestOrigin ?? "";
      }

      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
      }

      return allowedOrigins[0] || "";
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    exposeHeaders: ["Set-Cookie"],
  })
);

app.options("*", (c) => {
  return c.text("");
});

app.on(["POST", "GET"], "/api/auth/**", (c) => getAuth().handler(c.req.raw));

app.route("/api/folders", foldersRouter);

app.route("/api/bookmarks", bookmarksRouter);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
