import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";
import { Header } from "@/components/header";
import { useRef, useEffect } from "react";
import { currentFolderAtom } from "@/components/helpers/atoms";
import { useAtom } from "jotai";
import { getFaviconForFolder } from "@/lib/utils";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  beforeLoad: async ({ context }) => {
    return {};
  },
  head: () => ({
    meta: [
      {
        title: "Bookmarks",
      },
      {
        name: "description",
        content: "Bookmarks",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/logo.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentFolder] = useAtom(currentFolderAtom);

  // Debug: Log currentFolder changes
  useEffect(() => {
    console.log("Current folder changed:", currentFolder);
  }, [currentFolder]);

  // Update document title when currentFolder changes
  useEffect(() => {
    if (currentFolder?.name) {
      console.log("Setting document title to:", currentFolder.name);
      document.title = currentFolder.name;

      // Use getFaviconForFolder to convert emoji to SVG data URL
      const faviconUrl = getFaviconForFolder(currentFolder);
      console.log("Setting favicon to:", faviconUrl);

      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        linkElement.setAttribute("href", faviconUrl);
      }
    } else {
      // Reset to default if no folder is selected
      document.title = "Bookmarks";
      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        linkElement.setAttribute("href", "/logo.ico");
      }
    }
  }, [currentFolder]);

  return (
    <>
      <HeadContent />
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="grid grid-rows-[auto_1fr] h-svh">
          {isFetching ? <Loader /> : <Outlet />}
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
