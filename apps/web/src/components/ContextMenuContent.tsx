import type { Bookmark } from "@/types/bookmark";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ArrowRight, Link, Pencil, Pin, Tag as TagIcon } from "lucide-react";
import { currentFolderAtom, foldersAtom } from "./helpers/atoms";

const moveBookmarkFn = async (variables: { id: string; folderId: string }) => {
  const { id, folderId } = variables;
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to move bookmark.");
  }
  return response.json();
};

const togglePinFn = async (variables: { id: string; isPinned: boolean }) => {
  const response = await fetch(`/api/bookmarks/${variables.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPinned: variables.isPinned }),
  });

  if (!response.ok) {
    throw new Error("Failed to update bookmark pin status.");
  }
  return response.json();
};

export const ContextMenuContent = ({
  bookmark,
  setIsEditing,
  isPrivatePage,
  onOpenTagDialog,
}: {
  bookmark: Bookmark;
  setIsEditing: (value: boolean) => void;
  isPrivatePage: boolean;
  onOpenTagDialog: () => void;
}) => {
  const queryClient = useQueryClient();
  const [folders] = useAtom(foldersAtom);
  const [currentFolder] = useAtom(currentFolderAtom);

  const otherFolders = folders?.filter(
    (folder) => folder.id !== currentFolder?.id
  );

  const { mutate: moveBookmark } = useMutation({
    mutationFn: moveBookmarkFn,
    onMutate: async ({ id: bookmarkId, folderId: destinationFolderId }) => {
      const sourceFolderId = currentFolder?.id;
      if (!sourceFolderId) return;

      const queryKey = ["bookmarks", { folderId: sourceFolderId }];

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
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
      });

      return { previousData, sourceFolderId };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context.sourceFolderId) {
        queryClient.setQueryData(
          ["bookmarks", { folderId: context.sourceFolderId }],
          context.previousData
        );
      }
      console.error("Failed to move bookmark:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const { mutate: togglePin } = useMutation({
    mutationFn: togglePinFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedBookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  return (
    <ContextMenu.Content className="z-50 w-48 rounded-lg border border-black/10 bg-white/80 p-1 align-middle no-underline backdrop-blur-lg dark:border-white/10 dark:bg-black/80">
      <ContextMenu.Item
        className="rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10"
        onSelect={() => navigator.clipboard.writeText(bookmark.url)}
      >
        <div className="flex items-center gap-3 align-middle">
          <Link className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <p>Copy link</p>
        </div>
      </ContextMenu.Item>

      {isPrivatePage && (
        <ContextMenu.Item
          className="rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10"
          onSelect={() => setIsEditing(true)}
        >
          <div className="flex items-center gap-3 align-middle">
            <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p>Rename</p>
          </div>
        </ContextMenu.Item>
      )}

      {isPrivatePage && (
        <ContextMenu.Item
          className="rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10"
          onSelect={() =>
            togglePin({ id: bookmark.id, isPinned: !bookmark.isPinned })
          }
        >
          <div className="flex items-center gap-3 align-middle">
            <Pin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p>{bookmark.isPinned ? "Unpin" : "Pin"}</p>
          </div>
        </ContextMenu.Item>
      )}

      {isPrivatePage && onOpenTagDialog && (
        <ContextMenu.Item
          className="rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10"
          onSelect={() => onOpenTagDialog()}
        >
          <div className="flex items-center gap-3 align-middle">
            <TagIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p>Tags</p>
          </div>
        </ContextMenu.Item>
      )}

      {otherFolders && otherFolders.length > 0 && isPrivatePage && (
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 data-[state=open]:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10 dark:data-[state=open]:bg-white/10">
            <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p>Move to</p>
          </ContextMenu.SubTrigger>
          <ContextMenu.Portal>
            <ContextMenu.SubContent
              className="z-50 w-48 rounded-md border border-black/10 bg-white/80 p-1 align-middle no-underline backdrop-blur-lg dark:border-white/10 dark:bg-black/80"
              sideOffset={4}
              alignOffset={-2}
            >
              {otherFolders.map((folder) => (
                <ContextMenu.Item
                  key={folder.id}
                  className="rounded-md px-3 py-2 text-sm text-black outline-none transition-colors hover:cursor-pointer hover:bg-black/10 focus:outline-none dark:text-white dark:hover:bg-white/10"
                  onSelect={() => {
                    moveBookmark({
                      id: bookmark.id,
                      folderId: folder.id,
                    });
                  }}
                >
                  <div className="flex items-center gap-2 align-middle">
                    {folder?.icon && (
                      <div className="mb-0.5">{folder.icon}</div>
                    )}
                    <span className="font-medium">{folder?.name}</span>
                  </div>
                </ContextMenu.Item>
              ))}
            </ContextMenu.SubContent>
          </ContextMenu.Portal>
        </ContextMenu.Sub>
      )}
    </ContextMenu.Content>
  );
};
