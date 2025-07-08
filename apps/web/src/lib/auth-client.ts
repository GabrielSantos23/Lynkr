import { createAuthClient } from "better-auth/react";

// Resolve the Better-Auth backend URL:
// 1. Prefer a compile-time environment variable (VITE_SERVER_URL)
// 2. Otherwise, fall back to the current origin (works on Cloudflare Pages when the
//    server is deployed under the same domain or via a Pages Function proxy)
const resolvedBaseURL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "");

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
});
