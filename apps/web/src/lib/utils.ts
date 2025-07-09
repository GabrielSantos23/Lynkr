import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFaviconForFolder = (
  folder: { icon?: string | null } | null | undefined
) => {
  return folder?.icon
    ? `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${folder.icon}</text></svg>`
    : "/logo.ico";
};

export function useDocumentMeta({
  title,
  icon,
}: {
  title?: string;
  icon?: string;
}) {
  useEffect(() => {
    if (title) {
      const originalTitle = document.title;
      document.title = title;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [title]);

  useEffect(() => {
    if (icon) {
      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        const originalHref = linkElement.getAttribute("href");
        linkElement.setAttribute("href", icon);
        return () => {
          if (originalHref) {
            linkElement.setAttribute("href", originalHref);
          }
        };
      }
    }
  }, [icon]);
}
