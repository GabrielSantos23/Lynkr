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
import { Diamond, PinIcon } from "lucide-react";

import CreateFirstFolder from "@/components/bookmark_components/CreateFirstFolder";
import EmptyState from "@/components/EmptyState";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

export const Route = createFileRoute("/bookmarks")({
  component: RouteComponent,
  loader: () => {
    return {};
  },
  head: () => {
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
      if (pathname.startsWith("/bookmarks/public/")) {
        return;
      }
      navigate({ to: "/" });
    }
  }, [sessionPending, session, pathname, navigate]);

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

      const savedFolderId = localStorage.getItem("currentFolderId");
      const savedFolder = savedFolderId
        ? fetchedFolders.find((f: any) => f.id === savedFolderId)
        : null;

      if (savedFolder && savedFolder.id !== currentFolder?.id) {
        setCurrentFolder(savedFolder);
      } else if (!currentFolder) {
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

        setFilteredBookmarks((prev) => [optimisticBookmark, ...prev]);

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

        void queryClient.cancelQueries({ queryKey: ["bookmarks"] });

        return { optimisticBookmark };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", { folderId: currentFolder?.id }],
        });

        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ["bookmarks", { folderId: currentFolder?.id }],
          });
        }, 3000);
      },
      onError: (err, newBookmark, context) => {
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
      if (context?.previousData) {
        queryClient.setQueryData(
          ["bookmarks", { folderId: currentFolder?.id }],
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", { folderId: currentFolder?.id }],
      });
    },
  });

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

  const { mutate: togglePinMutation } = useMutation({
    mutationFn: updateBookmarkFn,
    onSettled: () => {
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
    (urlParam?: string) => {
      if (!currentFolder) return;

      const finalUrl = urlParam ?? inputUrl;

      if (
        !currentFolder.allowDuplicate &&
        filteredBookmarks.some((bookmark) => bookmark.url === finalUrl)
      ) {
        setIsDuplicate(true);

        setTimeout(() => {
          setIsDuplicate(false);
        }, 2000);

        return;
      }

      addBookmarkMutation({
        url: finalUrl,
        folderId: currentFolder.id,
      });
    },
    [addBookmarkMutation, inputUrl, currentFolder, filteredBookmarks]
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

  const LinkPlaceholder: React.FC = () => {
    return null;
  };

  useEffect(() => {
    const pasteHandler = (e: ClipboardEvent) => {
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
      <div className="p-3 sm:p-5 md:p-8">
        <Header inputRef={inputRef} />
        <div className="flex flex-col gap-2 sm:gap-4 items-center">
          <div className="w-full px-1 sm:px-4 pb-20 sm:pb-32 sm:w-[40rem] md:w-[48rem] md:px-0 lg:w-[50rem]">

              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative mx-2.5 md:mt-8 mt-6 md:mx-12"
                onSubmit={(e) => {
                  e.preventDefault();

                  if (
                    inputUrl.length === 0 ||
                    isAddingBookmark ||
                    !currentFolder
                  ) {
                    return;
                  }

                  if (
                    !currentFolder?.allowDuplicate &&
                    filteredBookmarks.some(
                      (bookmark) => bookmark.url === inputUrl
                    )
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
                  disabled={
                    isAddingBookmark ||
                    !currentFolder ||
                    !folders ||
                    folders.length === 0
                  }
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
                      filteredBookmarks.some(
                        (bookmark) => bookmark.url === text
                      )
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
                  placeholder={
                    !folders || folders.length === 0
                      ? "Create a folder first"
                      : "https://... or ⌘F"
                  }
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
                (isSearching || !infiniteBookmarksData) &&
                folders &&
                folders.length > 0 && <SkeletonList viewStyle={viewStyle} />}

              {filteredBookmarks.length > 0 && (
                <BookmarksList
                  showMonths={showMonths}
                  viewStyle={viewStyle}
                  bookmarks={filteredBookmarks}
                  handleDeleteBookmark={handleDeleteBookmark}
                  isPrivatePage
                />
              )}

              {(!folders || folders.length === 0) && foldersFetched && (
                <CreateFirstFolder />
              )}

              {pinnedBookmarks &&
                pinnedBookmarks.length === 0 &&
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                ((bookmarks && bookmarks.length === 0) ||
                  (filteredBookmarks && filteredBookmarks.length === 0)) &&
                foldersFetched &&
                !isDuplicate &&
                folders &&
                folders?.length > 0 &&
                (!isSearching || inputUrl.length === 0) &&
                !isAddingBookmark && (
                  <EmptyState title="Empty." icon={Diamond} description="" />
                )}
            </motion.ul>
            <div className="flex justify-center pt-10 align-middle">
              {isFetchingNextPage &&
                filteredBookmarks.length > 0 &&
                inputUrl.length === 0 && <Spinner size="md" />}
            </div>
          </div>

          <LinkPlaceholder />
        </div>
        <ScrollToTopButton position="bottom-right" showAfter={300} />
      </div>
  );
}
