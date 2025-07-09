import { Separator } from "../ui/separator";
import { Hotkey } from "./Hotkey";
import { Button } from "../ui/button";
import Loader from "../loader";
import { useAtom } from "jotai";
import {
  currentFolderAtom,
  bookmarksAtom,
  currentPageAtom,
} from "../helpers/atoms";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteFolderProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function DeleteFolder({
  onCancel,
  onSuccess,
}: DeleteFolderProps) {
  const [currentFolder] = useAtom(currentFolderAtom);
  const [, setBookmarks] = useAtom(bookmarksAtom);
  const [, setCurrentPage] = useAtom(currentPageAtom);
  const queryClient = useQueryClient();

  const { mutate: deleteFolder, isPending } = useMutation({
    mutationFn: async () => {
      if (!currentFolder) throw new Error("No folder selected");

      const res = await fetch(`/api/folders/${currentFolder.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Failed to delete folder");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });

      setBookmarks(null);
      setCurrentPage(1);

      onSuccess?.();
    },
  });

  if (!currentFolder) {
    return null;
  }

  return (
    <div className="bg-card/50 backdrop-blur-md py-4 px-6 rounded-lg border-border border-2">
      <div className="flex items-center gap-x-2 ">
        <span className="text-muted-foreground">Delete folder</span>
        <Hotkey key1="x" />
      </div>
      <Separator className="my-2" />
      <div className="flex items-center gap-x-2">
        <span className="text-muted-foreground text-sm">
          Are you sure? All{" "}
          <span className="font-bold text-foreground">
            {currentFolder._count?.bookmarks ?? 0}
          </span>{" "}
          bookmarks in this folder will be deleted.
        </span>
      </div>
      <div className="w-full flex gap-x-2 mt-4">
        <Button
          variant="outline"
          className="w-1/2 rounded-lg"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="w-1/2 rounded-lg"
          onClick={() => deleteFolder()}
          disabled={isPending}
        >
          {isPending ? <Loader /> : "Delete"}
        </Button>
      </div>
    </div>
  );
}
