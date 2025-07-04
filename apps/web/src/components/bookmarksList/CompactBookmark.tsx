import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { motion } from "framer-motion";
import { X, Pin as PinIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { itemVariants } from "../helpers/animationVariants";
import { Spinner } from "../ui/Spinner";
import { ContextMenuContent } from "../ContextMenuContent";
import TagDialog from "../TagDialog";

// Define a type for the bookmark for better type safety and reusability.
type Bookmark = {
  createdAt: Date;
  id: string;
  title: string;
  url: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  loading?: boolean;
  onClick?: () => void;
  isPinned: boolean;
  tags?: { name: string; color: string }[];
};

// This function handles the actual API call.
// It sends a PATCH request to your backend endpoint built with Drizzle/Neon.
const renameBookmarkFn = async (variables: { id: string; title: string }) => {
  const response = await fetch(`/api/bookmarks/${variables.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: variables.title }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename bookmark. Please try again.");
  }

  return response.json();
};

export const CompactBookmark = ({
  bookmark,
  onRemove,
  isPrivatePage,
}: {
  bookmark: Bookmark;
  onRemove?: (id: string) => void;
  isPrivatePage: boolean;
}) => {
  // Access the TanStack Query client.
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Local state for the title to enable instant UI feedback.
  const [title, setTitle] = useState(bookmark.title);
  const [openTagDialog, setOpenTagDialog] = useState(false);

  // TanStack Query's useMutation hook to handle the rename operation.
  const { mutate: renameBookmark } = useMutation({
    mutationFn: renameBookmarkFn,
    onMutate: async (newData: { id: string; title: string }) => {
      // Immediately exit editing mode.
      setIsEditing(false);

      // Snapshot the previous title to enable rollback on error.
      const previousTitle = title;

      // Optimistically update the UI with the new title.
      setTitle(newData.title);

      // Return the snapshot in a context object.
      return { previousTitle };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back to the previous title.
      if (context?.previousTitle) {
        setTitle(context.previousTitle);
      }
      // You could add a user-facing error message here (e.g., using a toast library).
      console.error("Error renaming bookmark:", err);
    },
    onSuccess: () => {
      // After the mutation succeeds, invalidate the bookmarks + pinned caches.
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["pinnedBookmarks"] });
    },
  });

  // Mutation to toggle pin status
  const togglePinFn = async (variables: { id: string; isPinned: boolean }) => {
    const response = await fetch(`/api/bookmarks/${variables.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: variables.isPinned }),
    });

    if (!response.ok) {
      throw new Error("Failed to update pin status.");
    }
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
    // Prevent API call if the title is empty or hasn't changed.
    if (title.trim().length === 0 || title.trim() === bookmark.title) {
      setTitle(bookmark.title); // Reset to original.
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
      // Defer selection to next tick to ensure it happens after focus
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
          className="relative hover:cursor-pointer list-none "
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
            <div className="flex w-full flex-row items-center gap-3 align-middle">
              {/* Favicon / Loading / Initial Display Logic (Unchanged) */}
              {bookmark.loading ? (
                <div className="flex min-h-[1.9rem] min-w-[1.9rem] items-center justify-center rounded-lg bg-black/10 p-2 dark:bg-white/10">
                  <Spinner size="sm" />
                </div>
              ) : bookmark.faviconUrl && !faviconError ? (
                <div className="flex min-h-[1.9rem] min-w-[1.9rem] items-center justify-center rounded-lg bg-black/10 p-2 dark:bg-white/10">
                  <img
                    src={bookmark.faviconUrl}
                    alt={`${bookmark.title} favicon`}
                    className="h-[0.9rem] w-[0.9rem] rounded-[0.2rem]"
                    onError={() => setFaviconError(true)}
                  />
                </div>
              ) : (
                <div className="flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-lg bg-gradient-to-br from-[#d2d1d1] to-[#dad7d7] text-xs font-semibold text-black dark:from-[#1a1a1a] dark:to-[#2d2c2c] dark:text-white">
                  {title.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Title Display and Edit Form */}
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
                    className="w-full bg-transparent font-medium text-black outline-none focus:outline-none dark:text-white"
                  />
                </form>
              ) : (
                <p className="max-w-full truncate font-medium text-black dark:text-white sm:max-w-[22rem] md:max-w-[22rem] lg:max-w-[24rem]">
                  {title}
                </p>
              )}
              {!isEditing && (
                <p className="hidden truncate text-sm text-muted-foreground sm:block sm:max-w-[10rem] md:max-w-[10rem] lg:max-w-[18rem]">
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
              )}
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
                    className="z-50 text-muted-foreground duration-300 ease-in-out hover:text-black dark:hover:text-white"
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
          bookmark={{ ...bookmark, title: title }}
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
