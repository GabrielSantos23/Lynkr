import { createAuthClient } from "better-auth/react";

// Force all requests made by the auth client to include cookies so that
// cross-site session cookies issued by the Better-Auth backend are sent.
const withCredentials: typeof fetch = (input, init = {}) => {
  // If the caller already specified credentials, respect it; otherwise include.
  const mergedInit: RequestInit = {
    credentials: "include",
    ...init,
    headers: {
      ...init.headers,
      "X-Requested-With": "XMLHttpRequest",
    },
  };
  return fetch(input, mergedInit);
};

// In both development and production we want the API to be served from the **same**
// origin as the web application (the server will typically be mounted under the
// same domain but behind a `/api` prefix or be proxied during local development).
// Using `window.location.origin` ensures that Better-Auth requests are sent to the
// current origin, keeping cookies and CORS simple.
//
// Note: `window` is always defined in the browser where this file executes. When
// running server-side rendering (SSR) you may want to guard for `typeof window`,
// but Lynkr currently renders purely on the client so this is safe.
const serverURL = window.location.origin;

export const authClient = createAuthClient({
  baseURL: serverURL,
  fetch: withCredentials,
  cookieOptions: {
    sameSite: "none",
    secure: true,
  },
});
