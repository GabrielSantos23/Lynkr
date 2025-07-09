import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";
import { Index as BookmarksList } from "@/components/bookmarksList/BookmarksList";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useDocumentMeta, getFaviconForFolder } from "@/lib/utils";
import { Diamond, PinIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { ViewButton } from "@/components/ViewButton";
import { SkeletonList } from "@/components/skeletons/SkeletonList";
import EmptyState from "@/components/EmptyState";

export const Route = createFileRoute("/bookmarks/public/$id")({
  component: PublicFolderComponent,
  loader: () => ({}),
  head: ({ params }) => ({
    meta: [{ title: `Public Folder ${params.id}` }],
  }),
});

const fetchPublicBookmarks = async (folderId: string, page: number = 1) => {
  const response = await fetch(
    `/api/folders/${folderId}/bookmarks?page=${page}`
  );
  if (!response.ok) throw new Error("Failed to fetch public bookmarks.");
  const data = await response.json();
  return {
    bookmarks: (data.bookmarks ?? []).map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
    })),
    totalElements: data.totalElements ?? 0,
  };
};

const fetchFolderDetails = async (folderId: string) => {
  const response = await fetch(`/api/folders?folderId=${folderId}`);
  if (!response.ok) throw new Error("Failed to fetch folder details");
  const data = await response.json();
  return data[0] ?? null;
};

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
  const [bookmarks, setBookmarks] = useState<SmallBookmark[] | null>(null);
  const [viewStyle, setViewStyle] = useState<"expanded" | "compact">("compact");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  const bookmarksQuery = useQuery({
    queryKey: ["publicBookmarks", folderId, currentPage],
    queryFn: () => fetchPublicBookmarks(folderId, currentPage),
    enabled: !!folderId,
    staleTime: 0,
  });

  const { data: folderDetails, isLoading: folderLoading } = useQuery({
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

  const { data: session } = authClient.useSession();
  const isCreator =
    session && folderDetails && session.user.id === folderDetails.userId;

  useEffect(() => {
    if (bookmarksQuery.data) {
      setBookmarks((prev) => {
        if (prev && currentPage > 1) {
          const newBookmarks = bookmarksQuery.data.bookmarks.filter(
            (bookmark) => {
              return !prev.find(
                (prevBookmark) => prevBookmark.id === bookmark.id
              );
            }
          );
          return [...prev, ...newBookmarks];
        } else {
          return bookmarksQuery.data.bookmarks;
        }
      });
      setTotalBookmarks(bookmarksQuery.data.totalElements);

      setTimeout(() => {
        setIsOpen(true);
      }, 10);
    }
  }, [bookmarksQuery.data, currentPage]);

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!isCreator) return;
    await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
  };

  const handleChangeViewStyle = () => {
    setIsOpen(false);

    setTimeout(() => {
      setIsOpen(true);
    }, 10);

    setViewStyle(viewStyle === "compact" ? "expanded" : "compact");
  };

  const handleChangeTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if (bookmarks?.length !== totalBookmarks && !bookmarksQuery.isLoading) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [bookmarks?.length, totalBookmarks, bookmarksQuery.isLoading]);

  useDocumentMeta({
    title: folderDetails?.name ?? `Folder ${folderId}`,
    icon: getFaviconForFolder(folderDetails),
  });

  React.useEffect(() => {
    if (!bookmarksQuery.isLoading) {
      console.log("Fetched public bookmarks", bookmarks);
    }
  }, [bookmarksQuery.isLoading, bookmarks]);

  useEffect(() => {
    document.title = folderDetails?.name ?? `Folder ${folderId}`;
  }, [folderId, folderDetails?.name]);

  if (bookmarksQuery.isError) {
    return (
      <div className="flex justify-center pt-10 text-red-500">
        Unable to load this public folder.
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full pb-32 flex-col items-center bg-[#e0e0e0] dark:bg-[#111111]">
      <ScrollToTopButton />

      <div className="w-full px-4 md:px-0 md:pt-16 pt-12 sm:w-[30rem] md:w-[40rem] lg:w-[50rem]">
        <div className="flex flex-col md:items-center md:justify-between justify-start gap-8 px-4 align-middle font-semibold text-black dark:text-white md:flex-row md:gap-0">
          {folderLoading ? (
            <motion.div
              key="folderNameLoading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-2"
            >
              {/* <RectangleSkeleton /> */}
            </motion.div>
          ) : (
            <motion.div
              key="folderNameLoaded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {folderDetails?.isShared ? (
                <div className="flex gap-3 align-middle">
                  <p className="text-2xl mb-1">{folderDetails?.icon}</p>
                  <p className="text-2xl">{folderDetails?.name}</p>
                </div>
              ) : (
                <p className="text-2xl">🔒 This folder is private</p>
              )}
            </motion.div>
          )}
          {folderDetails?.isShared && (
            <div className="items-center gap-6 align-middle md:gap-2 hidden sm:flex">
              <motion.div
                key="viewButtonLoaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ViewButton
                  viewStyle={viewStyle}
                  handleChangeViewStyle={handleChangeViewStyle}
                />
              </motion.div>
              <motion.div
                key="themeButtonLoaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* <ThemeToggle
                  theme={theme ?? ""}
                  handleChangeTheme={handleChangeTheme}
                /> */}
              </motion.div>
              <motion.div
                key="shareLinkButtonLoaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ShareLinkButton folderId={folderId} />
              </motion.div>
            </div>
          )}
        </div>

        <div className={`mx-3 md:mt-4 mt-2`}>
          <Separator />
        </div>

        {(folderLoading || bookmarksQuery.isLoading) && (
          <SkeletonList viewStyle={viewStyle} />
        )}

        {folderDetails?.isShared && (
          <>
            {pinnedBookmarks && pinnedBookmarks.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-row gap-1 sm:gap-2 items-start">
                  <div className="flex flex-col justify-center h-full pt-2 mt-4 sm:mt-5">
                    <PinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
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
                <Separator className="mt-3 sm:mt-4" />
              </div>
            )}

            <motion.div initial={false} animate={isOpen ? "open" : "closed"}>
              <motion.ul>
                {bookmarks && bookmarks.length > 0 && (
                  <BookmarksList
                    bookmarks={bookmarks}
                    showMonths={false}
                    viewStyle={viewStyle}
                    isPrivatePage={isCreator}
                    handleDeleteBookmark={
                      isCreator ? handleDeleteBookmark : undefined
                    }
                  />
                )}
                {bookmarks &&
                  bookmarks.length === 0 &&
                  !folderLoading &&
                  !bookmarksQuery.isLoading && (
                    <EmptyState title="Empty." icon={Diamond} description="" />
                  )}
              </motion.ul>
            </motion.div>
          </>
        )}

        <div className="flex justify-center pt-10 align-middle">
          {bookmarksQuery.isFetching &&
            bookmarks &&
            bookmarks?.length > 0 &&
            currentPage > 1 && <Spinner size="md" />}
        </div>
      </div>
    </main>
  );
}
