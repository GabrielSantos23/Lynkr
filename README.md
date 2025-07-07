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
   CORS_ORIGIN=http://localhost:3001
   BETTER_AUTH_SECRET=$(openssl rand -hex 32)
   BETTER_AUTH_URL=http://localhost:3000
   # libsodium symmetric key (generate with: openssl rand -base64 32)
   ENCRYPTION_KEY=<your_base64_key>
   ```

   And another for the web client:

   ```bash
   # apps/web/.env
   VITE_SERVER_URL=http://localhost:3000
   ```

3. **Apply the database schema**

   ```bash
   pnpm db:push
   ```

4. **Start the apps in development mode**

   ```bash
   pnpm dev
   ```

   • API: http://localhost:3000  
   • Web UI: http://localhost:3001

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
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
