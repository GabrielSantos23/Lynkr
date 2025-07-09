# Lynkr

Lynkr is a **modern, open-source bookmark manager** that helps you save, organize & **encrypt** your favourite links.
Build folders, add tags, pin items, use blazing-fast search and power-user hotkeys – all backed by PostgreSQL and an end-to-end typed TypeScript stack.

Under the hood Lynkr runs on React + TanStack Router (frontend) and Hono (backend), with Drizzle ORM for type-safe SQL and libsodium for symmetric encryption.

This repository was bootstrapped with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Features

- **TypeScript** - For type safety and improved developer experience
- **Bookmark Management** - Save, organize, pin and share your favorite links with folders, tags, and powerful search.
- **End-to-end Encryption** – Every title, URL and tag is encrypted client-side with libsodium before touching the database.
- **Productive Hotkeys** – Quickly change layouts, toggle theme or deduplicate links with single-key shortcuts.
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Email & password authentication with Better Auth
- **Turborepo** - Optimized monorepo build system

## Installation

Follow the steps below to spin up Lynkr locally:

1. **Clone & install dependencies**

   ```bash
   git clone https://github.com/<your-user>/lynkr.git
   cd lynkr
   pnpm install
   ```

2. **Configure environment variables**

   Create a `.env` file inside `apps/server` (adjust values as required):

   ```bash
   # apps/server/.env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/lynkr

   # In development we proxy API requests through Vite, so we can safely allow
   # any origin here. **DO NOT** use `*` in production – set your real domain.
   CORS_ORIGIN="*"

   BETTER_AUTH_SECRET=$(openssl rand -hex 32)

   # The public origin that users will visit. In dev this equals Vite's default
   # host (http://localhost:5173); in production use your real domain.
   BETTER_AUTH_URL=http://localhost:5173

   # libsodium symmetric key (generate with: openssl rand -base64 32)
   ENCRYPTION_KEY=<your_base64_key>
   ```

3. **Apply the database schema**

   ```bash
   pnpm db:push
   ```

4. **Start the apps in development mode**

   ```bash
   pnpm dev
   ```

   Vite serves the web UI **and** proxies all requests that start with `/api`
   to the backend running on port 3000, so you only need to open:

   • http://localhost:5173 – Web UI & API (proxied)

   If you prefer, you can run just the backend with `pnpm dev:server` and hit
   it directly on http://localhost:3000.

## Project Structure

```
Lynkr2/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono)
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application (port 5173)
- `pnpm dev:server`: Start only the server (port 3000)
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI

## Deploying to Cloudflare

Lynkr is designed to run completely server-less on Cloudflare's edge: the **server** is a
Worker and the **web** bundle is served by Cloudflare Pages. By routing all
`/api/*` traffic to the Worker we keep everything under the **same origin**, so
cookies, CORS and Better-Auth work automatically.

### 1. Build & deploy the web UI

1. Push your repository to GitHub/GitLab.
2. In the Cloudflare dashboard create a **Pages** project pointing at the repo.
3. Use these build settings:

   | Setting          | Value                                               |
   | ---------------- | --------------------------------------------------- |
   | Framework preset | `None`                                              |
   | Build command    | `pnpm --filter apps/web --workspace-root run build` |
   | Output directory | `apps/web/dist`                                     |

4. After the first deployment, add a **Custom Domain** (e.g. `lynkr.app`).

### 2. Deploy the API Worker

Inside `apps/server`:

```bash
pnpm install --filter apps/server         # install deps locally
pnpm build --filter apps/server           # transpile TypeScript → dist/
npx wrangler deploy                       # publish Worker
```

Configure these Worker variables/secrets:

| Name                    | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                    |
| `BETTER_AUTH_SECRET`    | 32-byte hex secret (`openssl rand -hex 32`)     |
| `BETTER_AUTH_URL`       | Your public site URL (e.g. `https://lynkr.app`) |
| `ENCRYPTION_KEY`        | 32-byte base64 libsodium key                    |
| ...social provider vars | `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.    |

**Route the Worker** to the same domain as Pages:

```
Route pattern: lynkr.app/api/* → Worker: zyvon-server
```

This will intercept every request under `/api` while the static assets continue
to be served by Pages.

### 3. Verify production

Visit `https://lynkr.app` – the browser makes XHR requests to
`https://lynkr.app/api/...`, which Cloudflare dutifully forwards to the Worker.

Enjoy your globally-distributed, Same-Origin Lynkr deployment! 🎉
