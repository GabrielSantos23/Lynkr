import { useAtom } from "jotai";
import { useHotkeys as useHotkeysHook } from "react-hotkeys-hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  currentFolderAtom,
  showMonthsAtom,
  viewStyleAtom,
} from "../helpers/atoms";
import { useTheme } from "../theme-provider";

export interface FolderUpdateParams {
  id: string;
  name: string | null;
  icon: string | null;
  isShared: boolean | null;
  allowDuplicate: boolean | null;
}

export const useProfileHotkeys = () => {
  const queryClient = useQueryClient();
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [viewStyle, setViewStyle] = useAtom(viewStyleAtom);
  const [showMonths, setShowMonths] = useAtom(showMonthsAtom);
  const { theme, setTheme } = useTheme();

  const updateFolder = useMutation({
    mutationFn: async (params: Partial<FolderUpdateParams>) => {
      if (!currentFolder) return null;

      const res = await fetch(`/api/folders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: params.name ?? undefined,
          icon: params.icon ?? undefined,
          isShared: params.isShared ?? undefined,
          allowDuplicate: params.allowDuplicate ?? undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update folder");
      }

      return res.json();
    },
    onSuccess: (updated) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ["folders"] });
        setCurrentFolder(updated);
      }
    },
  });

  const handleUpdateFolder = () => {
    if (!currentFolder) return;

    const updatedDuplicate = !currentFolder.allowDuplicate;

    const updatedFolder = {
      ...currentFolder,
      allowDuplicate: updatedDuplicate,
    };

    setCurrentFolder(updatedFolder);

    updateFolder.mutate({
      id: String(currentFolder.id),
      allowDuplicate: updatedDuplicate,
      icon: null,
      isShared: null,
      name: null,
    });
  };

  const handleChangeViewStyle = (newViewStyle: "compact" | "expanded") => {
    setViewStyle(newViewStyle);
    toast.success(`Switched to ${newViewStyle} view`);
  };

  const handleUpdateShowMonths = () => {
    setShowMonths(!showMonths);
    toast.success(`${!showMonths ? "Showing" : "Hiding"} months`);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme} mode`);
  };

  useHotkeysHook(
    "d",
    () => {
      handleUpdateFolder();
    },
    {
      enableOnFormTags: false,
    }
  );

  useHotkeysHook(
    "v",
    () => {
      handleChangeViewStyle(viewStyle === "compact" ? "expanded" : "compact");
    },
    {
      enableOnFormTags: false,
    }
  );

  useHotkeysHook(
    "m",
    () => {
      handleUpdateShowMonths();
    },
    {
      enableOnFormTags: false,
    }
  );

  useHotkeysHook(
    "t",
    () => {
      handleThemeToggle();
    },
    {
      enableOnFormTags: false,
    }
  );

  return {
    handleUpdateFolder,
    handleChangeViewStyle,
    handleUpdateShowMonths,
    handleThemeToggle,
    updateFolder,
    currentFolder,
    viewStyle,
    showMonths,
    theme,
  };
};
