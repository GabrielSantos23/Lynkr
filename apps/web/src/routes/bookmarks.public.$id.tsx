import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { Index as BookmarksList } from "@/components/bookmarksList/BookmarksList";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useDocumentMeta, getFaviconForFolder } from "@/lib/utils";
import { PinIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/bookmarks/public/$id")({
  component: PublicFolderComponent,
  loader: () => ({}),
  head: ({ params }) => ({
    meta: [{ title: `Public Folder ${params.id}` }],
  }),
});

const fetchPublicBookmarks = async (folderId: string) => {
  const response = await fetch(`/api/folders/${folderId}/bookmarks`);
  if (!response.ok) throw new Error("Failed to fetch public bookmarks.");
  const data = await response.json();
  // Convert createdAt strings to Date objects for BookmarksList component
  return (data.bookmarks ?? []).map((b: any) => ({
    ...b,
    createdAt: new Date(b.createdAt),
  }));
};

const fetchFolderDetails = async (folderId: string) => {
  const response = await fetch(`/api/folders?folderId=${folderId}`);
  if (!response.ok) throw new Error("Failed to fetch folder details");
  const data = await response.json();
  return data[0] ?? null; // API returns array
};

// Fetch pinned bookmarks for a public folder
const fetchPublicPinnedBookmarks = async (folderId: string) => {
  const response = await fetch(`/api/folders/${folderId}/pinned`);
  if (!response.ok) throw new Error("Failed to fetch pinned bookmarks.");
  const data = await response.json();
  return (data ?? []).map((b: any) => ({
    ...b,
    createdAt: new Date(b.createdAt),
  }));
};

type SmallBookmark = {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  createdAt: Date;
};

function PublicFolderComponent() {
  const { id: folderId } = Route.useParams();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [viewStyle, setViewStyle] = useState<"expanded" | "compact">("compact");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const {
    data: bookmarks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["publicBookmarks", folderId],
    queryFn: () => fetchPublicBookmarks(folderId),
    enabled: !!folderId,
    staleTime: 0,
  });

  const { data: folderDetails } = useQuery({
    queryKey: ["folderDetails", folderId],
    queryFn: () => fetchFolderDetails(folderId),
    enabled: !!folderId,
    staleTime: 60 * 1000,
  });

  const { data: pinnedBookmarks = [] } = useQuery({
    queryKey: ["publicPinnedBookmarks", folderId],
    queryFn: () => fetchPublicPinnedBookmarks(folderId),
    enabled: !!folderId,
    staleTime: 0,
  });

  // Determine if current session user is folder owner
  const { data: session } = authClient.useSession();
  const isCreator =
    session && folderDetails && session.user.id === folderDetails.userId;

  // Deletion handler only for creator (reuse API endpoint)
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!isCreator) return;
    await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
  };

  useDocumentMeta({
    title: folderDetails?.name ?? `Folder ${folderId}`,
    icon: getFaviconForFolder(folderDetails),
  });

  React.useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line no-console
      console.log("Fetched public bookmarks", bookmarks);
    }
  }, [isLoading, bookmarks]);

  useEffect(() => {
    document.title = `Folder ${folderId}`;
  }, [folderId]);

  if (isLoading) {
    return (
      <div className="flex justify-center pt-10">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center pt-10 text-red-500">
        Unable to load this public folder.
      </div>
    );
  }

  return (
    <div className="p-8 mx-auto max-w-3xl">
      {/* Pinned bookmarks */}
      {pinnedBookmarks && pinnedBookmarks.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-row gap-2 items-start">
            <div className="flex flex-col justify-center h-full pt-2 mt-5">
              <PinIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <BookmarksList
                showMonths={false}
                viewStyle="compact"
                bookmarks={pinnedBookmarks}
                isPrivatePage={isCreator}
                handleDeleteBookmark={
                  isCreator ? handleDeleteBookmark : undefined
                }
              />
            </div>
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {/* Regular bookmarks */}
      <BookmarksList
        showMonths={false}
        viewStyle="compact"
        bookmarks={bookmarks}
        isPrivatePage={isCreator}
        handleDeleteBookmark={isCreator ? handleDeleteBookmark : undefined}
      />
    </div>
  );
}
