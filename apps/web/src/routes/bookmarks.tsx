import {
  bookmarksAtom,
  showMonthsAtom,
  foldersAtom,
  totalBookmarksAtom,
  viewStyleAtom,
  currentFolderAtom,
  currentPageAtom,
} from "@/components/helpers/atoms";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useAtom } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFaviconForFolder } from "@/lib/utils";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { isValidURL } from "@/components/helpers/isValidURL";
import { Spinner } from "@/components/ui/Spinner";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Bookmark } from "@/types/bookmark";
import { SkeletonList } from "@/components/skeletons/SkeletonList";
import { Index as BookmarksList } from "@/components/bookmarksList/BookmarksList";
import { PinIcon } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  component: RouteComponent,
  loader: () => {
    // This loader ensures the component re-renders when navigating back to this route
    return {};
  },
  head: () => {
    // Default values for initial page load
    return {
      meta: [
        {
          title: "Bookmarks",
        },
      ],
      links: [
        {
          rel: "icon",
          href: "/logo.ico",
        },
      ],
      scripts: [
        {
          defer: true,
          src: "https://cloud.umami.is/script.js",
          "data-website-id": "5f36385d-9b15-4127-925b-808fba9d75d3",
        },
      ],
    };
  },
});

const getFoldersFn = async (userId: string) => {
  const response = await fetch(`/api/folders?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch folders.");
  return response.json();
};

const getBookmarksFn = async ({
  pageParam = 1,
  folderId,
  search = "",
}: {
  pageParam: number;
  folderId: string;
  search: string;
}) => {
  const queryParams = new URLSearchParams({
    page: pageParam.toString(),
    search,
  });
  const response = await fetch(
    `/api/folders/${folderId}/bookmarks?${queryParams}`
  );
  if (!response.ok) throw new Error("Failed to fetch bookmarks.");
  // Assume API returns { bookmarks: [], hasMore: boolean, totalElements: number }
  return response.json();
};

const createBookmarkFn = async (newBookmark: {
  url: string;
  folderId: string;
}) => {
  const response = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBookmark),
  });
  if (!response.ok) throw new Error("Failed to create bookmark.");
  return response.json();
};

const deleteBookmarkFn = async (bookmarkId: string) => {
  const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete bookmark.");
  return response.json();
};

// Fetch pinned bookmarks for a folder
const getPinnedBookmarksFn = async ({
  folderId,
  search = "",
}: {
  folderId: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams({ search });
  const response = await fetch(
    `/api/folders/${folderId}/pinned?${queryParams}`
  );
  if (!response.ok) throw new Error("Failed to fetch pinned bookmarks.");
  return response.json();
};

// Update bookmark (used for pin/unpin)
const updateBookmarkFn = async (variables: {
  id: string;
  isPinned: boolean;
}) => {
  const response = await fetch(`/api/bookmarks/${variables.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPinned: variables.isPinned }),
  });
  if (!response.ok) throw new Error("Failed to update bookmark.");
  return response.json();
};

// Helper functions
const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getWebsiteName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return url;
  }
};

const getCommonFavicons = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return "/logo.ico";
  }
};

function RouteComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputUrl, setInputUrl] = useState("");
  const inputUrlDebounced = useDebounce(inputUrl, 50);
  const [bookmarks, setBookmarks] = useAtom(bookmarksAtom);
  const [totalBookmarks, setTotalBookmarks] = useAtom(totalBookmarksAtom);
  const [, setFolders] = useAtom(foldersAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
  const [viewStyle] = useAtom(viewStyleAtom);
  const [showMonths] = useAtom(showMonthsAtom);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [folders] = useAtom(foldersAtom);
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!sessionPending && !session) {
      // Allow unauthenticated access to public shared folders
      if (pathname.startsWith("/bookmarks/public/")) {
        return;
      }
      navigate({ to: "/" });
    }
  }, [sessionPending, session, pathname, navigate]);

  // Determine if we are on the public shared folder route. If so, render child route only.
  const isPublicRoute = pathname.startsWith("/bookmarks/public/");

  if (isPublicRoute) {
    return <Outlet />;
  }

  const { data: fetchedFolders, isFetched: foldersFetched } = useQuery({
    queryKey: ["folders", userId],
    queryFn: () => getFoldersFn(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (fetchedFolders) {
      setFolders(fetchedFolders);

      // Always try to restore the last-opened folder from localStorage.
      // If it exists and differs from the current selection, update it.
      const savedFolderId = localStorage.getItem("currentFolderId");
      const savedFolder = savedFolderId
        ? fetchedFolders.find((f: any) => f.id === savedFolderId)
        : null;

      if (savedFolder && savedFolder.id !== currentFolder?.id) {
        setCurrentFolder(savedFolder);
      } else if (!currentFolder) {
        // If no folder is selected at all, fall back to the first one
        setCurrentFolder(fetchedFolders[0] ?? null);
      }
    }
  }, [fetchedFolders, currentFolder, setFolders, setCurrentFolder]);

  const { data: searchedBookmarksData, isFetching: isSearching } = useQuery({
    queryKey: [
      "bookmarks",
      { folderId: currentFolder?.id, search: inputUrlDebounced },
    ],
    queryFn: () =>
      getBookmarksFn({
        pageParam: 1,
        folderId: currentFolder!.id,
        search: inputUrlDebounced,
      }),
    enabled: !!currentFolder && inputUrlDebounced.length > 0,
  });

  // Use infinite query for paginated bookmarks
  const {
    data: infiniteBookmarksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["bookmarks", { folderId: currentFolder?.id }],
    queryFn: ({ pageParam }) =>
      getBookmarksFn({
        pageParam,
        folderId: currentFolder!.id,
        search: "",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, _: any, lastPageParam: number) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    enabled: !!currentFolder && inputUrlDebounced.length === 0,
  });

  const { mutate: addBookmarkMutation, isPending: isAddingBookmark } =
    useMutation({
      mutationFn: createBookmarkFn,
      onMutate: async (newBookmark) => {
        setInputUrl("");

        // Build a quick, readable title from the hostname so user sees something meaningful instantly
        const tempTitle = getWebsiteName(newBookmark.url);

        const optimisticBookmark: Bookmark = {
          id: `temp-${Date.now()}`,
          url: newBookmark.url,
          title: tempTitle,
          faviconUrl: `https://www.google.com/s2/favicons?domain=${
            new URL(newBookmark.url).hostname
          }&sz=128`,
          ogImageUrl: null,
          createdAt: new Date(),
        };

        // Update the directly-rendered list right away for snappier feedback
        setFilteredBookmarks((prev) => [optimisticBookmark, ...prev]);

        // Immediately inject into cache for instant UI update
        queryClient.setQueryData(
          ["bookmarks", { folderId: currentFolder?.id }],
          (oldData: any) => {
            if (!oldData) return oldData; // if cache not ready yet, skip
            const newData = { ...oldData };
            newData.pages[0].bookmarks = [
              optimisticBookmark,
              ...newData.pages[0].bookmarks,
            ];
            return newData;
          }
        );

        // Cancel ongoing fetches *after* we've done the optimistic update so we don't delay UI
        void queryClient.cancelQueries({ queryKey: ["bookmarks"] });

        return { optimisticBookmark };
      },
      onSuccess: () => {
        // Immediately refetch once (placeholder data becomes available fast)
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", { folderId: currentFolder?.id }],
        });

        // Schedule a secondary refetch a bit later so we pick up the
        // enriched metadata pushed by the server in the background.
        // (Microlink usually responds within ~1s, but we give it some
        // extra buffer.)
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["bookmarks", { folderId: currentFolder?.id }],
          });
        }, 3000);
      },
      onError: (err, newBookmark, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ["bookmarks", { folderId: currentFolder?.id }],
          (oldData: any) => {
            const newData = { ...oldData };
            newData.pages[0].bookmarks = newData.pages[0].bookmarks.filter(
              (b: Bookmark) => b.id !== context?.optimisticBookmark.id
            );
            return newData;
          }
        );
      },
    });

  // Mutation to delete a bookmark
  const { mutate: deleteBookmarkMutation } = useMutation({
    mutationFn: deleteBookmarkFn,
    onMutate: async (bookmarkId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previousData = queryClient.getQueryData([
        "bookmarks",
        { folderId: currentFolder?.id },
      ]);

      queryClient.setQueryData(
        ["bookmarks", { folderId: currentFolder?.id }],
        (oldData: any) => {
          const newData = {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              bookmarks: page.bookmarks.filter(
                (b: Bookmark) => b.id !== bookmarkId
              ),
            })),
          };
          return newData;
        }
      );

      return { previousData };
    },
    onError: (err, bookmarkId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["bookmarks", { folderId: currentFolder?.id }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Ensure consistency with the server
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", { folderId: currentFolder?.id }],
      });
    },
  });

  // Query for pinned bookmarks
  const { data: pinnedBookmarks = [], refetch: refetchPinned } = useQuery({
    queryKey: [
      "pinnedBookmarks",
      { folderId: currentFolder?.id, search: inputUrlDebounced },
    ],
    queryFn: () =>
      getPinnedBookmarksFn({
        folderId: currentFolder!.id,
        search: inputUrlDebounced,
      }),
    enabled: !!currentFolder,
  });

  // Mutation to pin/unpin bookmark
  const { mutate: togglePinMutation } = useMutation({
    mutationFn: updateBookmarkFn,
    onSettled: () => {
      // Refresh both pinned list and regular list
      queryClient.invalidateQueries({
        queryKey: ["pinnedBookmarks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", { folderId: currentFolder?.id }],
      });
    },
  });

  const filteredBookmarksData = useMemo(() => {
    if (inputUrlDebounced.length > 0) {
      return searchedBookmarksData?.bookmarks ?? [];
    }
    return infiniteBookmarksData?.pages.flatMap((page) => page.bookmarks) ?? [];
  }, [inputUrlDebounced, searchedBookmarksData, infiniteBookmarksData]);

  const filteredTotalBookmarks = useMemo(() => {
    if (inputUrlDebounced.length > 0) {
      return searchedBookmarksData?.totalElements ?? 0;
    }
    return infiniteBookmarksData?.pages[0]?.totalElements ?? 0;
  }, [inputUrlDebounced, searchedBookmarksData, infiniteBookmarksData]);

  useEffect(() => {
    setFilteredBookmarks(filteredBookmarksData);
  }, [filteredBookmarksData]);

  const handleCreateBookmark = useCallback(
    (url?: string) => {
      if (!currentFolder) return;
      addBookmarkMutation({
        url: url ?? inputUrl,
        folderId: currentFolder.id,
      });
    },
    [addBookmarkMutation, inputUrl, currentFolder]
  );

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      deleteBookmarkMutation(id);
    },
    [deleteBookmarkMutation]
  );

  useEffect(() => {
    if (currentFolder) {
      document.title = currentFolder.name;
      const faviconUrl = getFaviconForFolder(currentFolder);
      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        linkElement.setAttribute("href", faviconUrl);
      }
    }
  }, [currentFolder]);

  // Effect: keyboard shortcut Ctrl/Cmd+F to focus input
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  // Effect: global paste to add bookmark without focusing input
  useEffect(() => {
    const pasteHandler = (e: ClipboardEvent) => {
      // ignore if active element is editable
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text || !isValidURL(text) || isAddingBookmark || !currentFolder)
        return;
      e.preventDefault();
      setInputUrl(text);
      handleCreateBookmark(text);
    };
    window.addEventListener("paste", pasteHandler);
    return () => window.removeEventListener("paste", pasteHandler);
  }, [isAddingBookmark, currentFolder, handleCreateBookmark]);

  return (
    <div className="p-8">
      <Header inputRef={inputRef} />
      <div className="flex flex-col gap-4 items-center">
        <div className="w-full  px-4 pb-32 sm:w-[40rem] md:w-[48rem] md:px-0 lg:w-[50rem]">
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative mx-2.5 md:mt-8 mt-6 md:mx-12"
            onSubmit={(e) => {
              e.preventDefault();

              if (inputUrl.length === 0 || isAddingBookmark || !currentFolder) {
                return;
              }

              if (
                !currentFolder?.allowDuplicate &&
                filteredBookmarks.some((bookmark) => bookmark.url === inputUrl)
              ) {
                setIsDuplicate(true);

                setTimeout(() => {
                  setIsDuplicate(false);
                }, 2000);

                return;
              }

              handleCreateBookmark();
            }}
          >
            <input
              type="url"
              name="url"
              id="url"
              ref={inputRef}
              value={isDuplicate ? "Duplicate" : inputUrl}
              disabled={isAddingBookmark || !currentFolder}
              onChange={(e) => setInputUrl(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text/plain");

                if (
                  text.length === 0 ||
                  inputUrl.length > 0 ||
                  !isValidURL(text) ||
                  isAddingBookmark
                ) {
                  return;
                }

                setInputUrl(text);

                if (
                  !currentFolder?.allowDuplicate &&
                  filteredBookmarks.some((bookmark) => bookmark.url === text)
                ) {
                  setIsDuplicate(true);

                  setTimeout(() => {
                    setInputUrl(text);

                    setIsDuplicate(false);
                  }, 2000);

                  return;
                }

                handleCreateBookmark(text);
              }}
              placeholder="https://... or ⌘F"
              className={`w-full rounded-lg border border-black/10 bg-black/10 px-4 py-2 font-normal text-black no-underline placeholder-zinc-600 transition duration-200 ease-in-out placeholder:font-normal hover:bg-black/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 
                  ${
                    isDuplicate
                      ? "animate-shake ring-2 ring-red-500 focus:outline-none focus:ring-red-500"
                      : "outline-zinc-500 focus:outline-none focus:ring-zinc-500"
                  }`}
            />
            {(isAddingBookmark || !currentFolder || isSearching) &&
              folders &&
              folders?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5, transition: { delay: 1 } }}
                  exit={{ opacity: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transform"
                >
                  <Spinner size="md" />
                </motion.div>
              )}
          </motion.form>

          <div className={`mx-3 mt-6`}>
            <Separator />
          </div>

          {/* Pinned bookmarks section (now below the input) */}
          {pinnedBookmarks && pinnedBookmarks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className=" mt-4 "
            >
              <div className="flex flex-row gap-2 items-start">
                <div className="flex flex-col justify-center h-full pt-2 mt-5">
                  <PinIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <BookmarksList
                    showMonths={false}
                    viewStyle={viewStyle}
                    bookmarks={pinnedBookmarks}
                    handleDeleteBookmark={handleDeleteBookmark}
                    isPrivatePage
                  />
                </div>
              </div>
              <Separator className="mt-4" />
            </motion.div>
          )}

          <motion.ul>
            {filteredBookmarks.length === 0 &&
              (isSearching || !infiniteBookmarksData) && (
                <SkeletonList viewStyle={viewStyle} />
              )}

            {filteredBookmarks.length > 0 && (
              <BookmarksList
                showMonths={showMonths}
                viewStyle={viewStyle}
                bookmarks={filteredBookmarks}
                handleDeleteBookmark={handleDeleteBookmark}
                isPrivatePage
              />
            )}

            {/* {(!folders || folders.length === 0) &&
                fetchFolders.isFetched &&
                !fetchFolders.isFetching && <CreateFirstFolder />} */}

            {/* {totalBookmarks === 0 &&
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                ((bookmarks && bookmarks.length === 0) ||
                  (filteredBookmarks && filteredBookmarks.length === 0)) &&
                fetchBookmarks.isFetched &&
                fetchFolders.isFetched &&
                !isDuplicate &&
                folders &&
                folders?.length > 0 &&
                (!fetchBookmarsWithSearch.isFetching ||
                  inputUrl.length === 0) &&
                !addBookmark.isLoading && <EmptyState />} */}
          </motion.ul>
          <div className="flex justify-center pt-10 align-middle">
            {isFetchingNextPage &&
              filteredBookmarks.length > 0 &&
              inputUrl.length === 0 && <Spinner size="md" />}
          </div>
        </div>
      </div>
    </div>
  );
}
