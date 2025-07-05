import type { Bookmark } from "@/types/bookmark";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Pin as PinIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ContextMenuContent } from "../ContextMenuContent";
import { itemVariants } from "../helpers/animationVariants";
import { Spinner } from "../ui/Spinner";
import TagDialog from "../TagDialog";

// This async function handles the API request to rename the bookmark.
const renameBookmarkFn = async (variables: { id: string; title: string }) => {
  const response = await fetch(`/api/bookmarks/${variables.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: variables.title }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename bookmark.");
  }
  return response.json();
};

export const ExpandedBookmark = ({
  bookmark,
  onRemove,
  isPrivatePage,
}: {
  // Use the imported Bookmark type if available, otherwise define it.
  bookmark: Bookmark & { loading?: boolean; onClick?: () => void };
  onRemove?: (id: string) => void;
  isPrivatePage: boolean;
}) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [title, setTitle] = useState(bookmark.title);
  const [openTagDialog, setOpenTagDialog] = useState(false);

  // Keep local title in sync with prop updates (avoid overwriting during edit)
  useEffect(() => {
    if (!isEditing) {
      setTitle(bookmark.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmark.title]);

  // TanStack Query's useMutation hook for the rename operation.
  const { mutate: renameBookmark } = useMutation({
    mutationFn: renameBookmarkFn,
    onMutate: async (newData: { id: string; title: string }) => {
      setIsEditing(false);
      const previousTitle = title;
      setTitle(newData.title); // Optimistically update the title
      return { previousTitle };
    },
    onError: (err, variables, context) => {
      // Roll back to the previous title on failure
      if (context?.previousTitle) {
        setTitle(context.previousTitle);
      }
      console.error("Failed to rename bookmark:", err);
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["pinnedBookmarks"] });
    },
  });

  // Toggle pin mutation
  const togglePinFn = async (variables: { id: string; isPinned: boolean }) => {
    const response = await fetch(`/api/bookmarks/${variables.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: variables.isPinned }),
    });
    if (!response.ok) throw new Error("Failed to update pin status.");
    return response.json();
  };

  const { mutate: togglePin } = useMutation({
    mutationFn: togglePinFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedBookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const handleRenameSubmit = () => {
    // Prevent API call if title is empty or unchanged
    if (title.trim().length === 0 || title.trim() === bookmark.title) {
      setTitle(bookmark.title); // Reset to original
      setIsEditing(false);
      return;
    }

    renameBookmark({
      id: bookmark.id,
      title: title.trim(),
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      setTimeout(() => {
        try {
          input.select();
        } catch {
          /* noop */
        }
      }, 0);
    }
  }, [isEditing]);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <motion.li
          layout
          variants={itemVariants}
          key={bookmark.id}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
          className="relative hover:cursor-pointer list-none"
          onClick={() => {
            if (isEditing) return;
            if (bookmark.onClick) {
              bookmark.onClick();
              return;
            }
            window.open(bookmark.url, "_blank");
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div className="relative flex items-center justify-between rounded-2xl p-3 align-middle transition-colors duration-200 ease-out hover:bg-black/5 dark:hover:bg-white/5">
            <div className="flex w-full flex-row items-center gap-5 align-middle">
              {/* OG Image / Loading / Fallback Display Logic (Unchanged) */}
              {bookmark.loading ? (
                <div className="flex h-16 w-48 items-center justify-center rounded-lg bg-black/10 p-2 dark:bg-white/10">
                  <Spinner size="md" />
                </div>
              ) : bookmark.ogImageUrl && !imageError ? (
                <motion.div
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:block"
                >
                  <img
                    src={String(bookmark.ogImageUrl)}
                    alt={bookmark.title}
                    width={192} // Adjusted for aspect ratio
                    height={108}
                    className="h-16 w-48 rounded-md object-cover"
                    onError={() => setImageError(true)}
                  />
                </motion.div>
              ) : (
                <div className="hidden h-16 w-48 rounded-md bg-gradient-to-br from-[#e0e0e0] to-[#dad7d7] dark:from-[#1a1a1a] dark:to-[#2d2c2c] md:block" />
              )}
              <div className="flex flex-col gap-2 sm:pl-2 md:pl-0">
                {isEditing ? (
                  <form
                    className="w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameSubmit();
                    }}
                  >
                    <input
                      type="text"
                      ref={inputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent text-lg font-medium text-black outline-none focus:outline-none dark:text-white"
                    />
                  </form>
                ) : (
                  <motion.p
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-[20rem] truncate text-lg font-medium text-black dark:text-white sm:max-w-[24rem] md:max-w-[24rem] lg:max-w-[30rem]"
                  >
                    {title}
                  </motion.p>
                )}
                <div className="flex items-center gap-2 align-middle">
                  {bookmark.faviconUrl && !faviconError ? (
                    <img
                      src={bookmark.faviconUrl}
                      alt={`${bookmark.title} favicon`}
                      width={14}
                      height={14}
                      className="rounded-sm"
                      onError={() => setFaviconError(true)}
                    />
                  ) : (
                    <div className="h-[14px] w-[14px] rounded-sm bg-gradient-to-br from-[#bdbdbd] to-[#ececec] dark:from-[#1a1a1a] dark:to-[#2d2c2c]" />
                  )}
                  <p className="w-48 truncate text-sm text-muted-foreground sm:w-72 md:w-96 md:max-w-sm">
                    {bookmark.url}
                    {bookmark.tags &&
                      bookmark.tags.map((tag) => (
                        <span
                          key={tag.name}
                          style={{ color: tag.color }}
                          className="pl-1 opacity-70 hover:opacity-100"
                        >
                          #{tag.name}
                        </span>
                      ))}
                  </p>
                </div>
              </div>
            </div>
            {isPrivatePage && bookmark.id !== "temp" && !isEditing && (
              <div className="flex gap-1 pr-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovering ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="z-50 text-zinc-500 duration-300 ease-in-out hover:text-black dark:hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin({
                      id: bookmark.id,
                      isPinned: !bookmark.isPinned,
                    });
                  }}
                  title={bookmark.isPinned ? "Unpin" : "Pin"}
                >
                  <PinIcon
                    className={`h-4 w-4 ${
                      bookmark.isPinned
                        ? "fill-muted-foreground"
                        : "text-muted-foreground"
                    }`}
                  />
                </motion.button>
                {onRemove && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovering ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="z-50 text-zinc-500 duration-300 ease-in-out hover:text-black dark:hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(bookmark.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.li>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenuContent
          bookmark={bookmark}
          setIsEditing={setIsEditing}
          isPrivatePage={isPrivatePage}
          onOpenTagDialog={() => setOpenTagDialog(true)}
        />
      </ContextMenu.Portal>
      {/* Tag editor dialog */}
      <TagDialog
        bookmark={bookmark}
        open={openTagDialog}
        onOpenChange={setOpenTagDialog}
      />
    </ContextMenu.Root>
  );
};
