import { createAuthClient } from "better-auth/react";

const withCredentials: typeof fetch = (input, init = {}) => {
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

const serverURL = window.location.origin;

export const authClient = createAuthClient({
  baseURL: serverURL,
  fetch: withCredentials,
  cookieOptions: {
    sameSite: "none",
    secure: true,
  },
});
