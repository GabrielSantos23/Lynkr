import "dotenv/config";
import { auth } from "./lib/auth";
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
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// folders routes
app.route("/api/folders", foldersRouter);

// bookmarks routes
app.route("/api/bookmarks", bookmarksRouter);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
