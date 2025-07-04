import { useQuery } from "@tanstack/react-query";
import * as Select from "@radix-ui/react-select";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { CheckIcon, ChevronDownIcon, PlusIcon, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  bookmarksAtom,
  currentPageAtom,
  currentFolderAtom,
  foldersAtom,
  isOpenAtom,
  folderDropdownOpenAtom,
  isNewFolderModalOpenAtom,
  isDeleteFolderModalOpenAtom,
} from "../helpers/atoms";
import { Hotkey } from "./Hotkey";
import Loader from "../loader";
import { Separator } from "../ui/separator";
import CreateFolder from "./CreateFolder";
import DeleteFolder from "./DeleteFolder";
import { authClient } from "@/lib/auth-client";
import { getFaviconForFolder } from "@/lib/utils";

type Folder = {
  id: string;
  name: string;
  icon: string;
  allowDuplicate: boolean;
  isShared: boolean;
  createdAt: Date;
  _count?: {
    bookmarks: number;
  };
};

export const FolderDropdown = () => {
  const [folders, setFolders] = useAtom(foldersAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [, setIsOpen] = useAtom(isOpenAtom);
  const [, setBookmarks] = useAtom(bookmarksAtom);
  const [, setCurrentPage] = useAtom(currentPageAtom);
  const [selectOpen, setSelectOpen] = useAtom(folderDropdownOpenAtom);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useAtom(
    isNewFolderModalOpenAtom
  );
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useAtom(
    isDeleteFolderModalOpenAtom
  );
  const { data: session } = authClient.useSession();

  // This async function handles the API request to get all folders
  const getFoldersFn = async (): Promise<Folder[]> => {
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;
    const response = await fetch(`/api/folders?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch folders.");
    }

    const raw = await response.json();
    // Ensure createdAt is a Date instance to satisfy Folder type
    return raw.map((f: any) => ({
      ...f,
      createdAt: new Date(f.createdAt),
    })) as Folder[];
  };

  const {
    data: fetchedFolders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["folders", session?.user?.id],
    queryFn: getFoldersFn,
    enabled: !!session?.user?.id,
  });

  // Sync TanStack Query data with Jotai atoms
  useEffect(() => {
    if (fetchedFolders) {
      console.log("Fetched folders:", fetchedFolders);

      // 1. Update global folders list
      setFolders(fetchedFolders);

      // 2. If no folder is selected OR the selected folder no longer exists, pick the first or load from localStorage
      if (fetchedFolders.length > 0) {
        // Check if we have a saved folder ID in localStorage
        const savedFolderId = localStorage.getItem("currentFolderId");
        console.log("Saved folder ID from localStorage:", savedFolderId);

        // Try to find the saved folder in the fetched folders
        const savedFolder = savedFolderId
          ? fetchedFolders.find((f) => f.id === savedFolderId)
          : null;

        console.log("Found saved folder:", savedFolder);

        const currentExists = currentFolder
          ? fetchedFolders.some((f) => f.id === currentFolder.id)
          : false;

        console.log(
          "Current folder exists:",
          currentExists,
          "Current folder:",
          currentFolder
        );

        if (!currentExists) {
          // If we have a saved folder and it exists in the fetched folders, use it
          if (savedFolder) {
            console.log("Setting current folder to saved folder:", savedFolder);
            setCurrentFolder(savedFolder);

            // Update document title and favicon immediately
            document.title = savedFolder.name;
            const faviconUrl = getFaviconForFolder(savedFolder);
            const linkElement = document.querySelector('link[rel="icon"]');
            if (linkElement) {
              linkElement.setAttribute("href", faviconUrl);
            }
          } else {
            // Otherwise, use the first folder
            console.log(
              "Setting current folder to first folder:",
              fetchedFolders[0]
            );
            setCurrentFolder(fetchedFolders[0]);
            localStorage.setItem("currentFolderId", fetchedFolders[0].id);

            // Update document title and favicon immediately
            document.title = fetchedFolders[0].name;
            const faviconUrl = getFaviconForFolder(fetchedFolders[0]);
            const linkElement = document.querySelector('link[rel="icon"]');
            if (linkElement) {
              linkElement.setAttribute("href", faviconUrl);
            }
          }
        }
      } else {
        // No folders at all – make sure state stays clean
        console.log("No folders available, clearing current folder");
        setCurrentFolder(null);
        localStorage.removeItem("currentFolderId");
      }
    }
  }, [fetchedFolders, currentFolder, setFolders, setCurrentFolder]);

  // NEW EFFECT: Persist the currently selected folder to localStorage and update
  // document title & favicon whenever `currentFolder` changes. This guarantees
  // that the last opened folder is remembered across sessions.
  useEffect(() => {
    if (currentFolder) {
      // Save the currently open folder ID
      localStorage.setItem("currentFolderId", currentFolder.id);

      // Update document title and favicon for immediate feedback
      document.title = currentFolder.name;
      const faviconUrl = getFaviconForFolder(currentFolder);
      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        linkElement.setAttribute("href", faviconUrl);
      }
    } else {
      // If no folder is selected, clean up the storage and revert UI elements
      localStorage.removeItem("currentFolderId");
      document.title = "Bookmarks";
      const linkElement = document.querySelector('link[rel="icon"]');
      if (linkElement) {
        linkElement.setAttribute("href", "/logo.ico");
      }
    }
  }, [currentFolder]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex h-[40px] items-center px-3 font-medium text-muted-foreground">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[40px] items-center px-3 font-medium text-red-500">
        Error loading folders.
      </div>
    );
  }

  // If there are no folders, don't render the dropdown
  // if (!folders || folders.length === 0) {
  //   return null;
  // }

  return (
    <>
      <Select.Root
        value={currentFolder?.id}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={(value) => {
          console.log("Folder selected with value:", value);
          const folder = folders?.find((folder) => folder.id === value);
          console.log("Found folder:", folder);

          if (folder?.id !== currentFolder?.id) {
            console.log(
              "Changing current folder from",
              currentFolder,
              "to",
              folder
            );
            setIsOpen(false);
            setBookmarks(null);
            setCurrentPage(1);
            setSelectOpen(false);
            setCurrentFolder(folder ?? null);

            // Save current folder ID to localStorage for persistence
            if (folder) {
              console.log("Saving folder ID to localStorage:", folder.id);
              localStorage.setItem("currentFolderId", folder.id);

              // Directly update document title and favicon for immediate feedback
              document.title = folder.name;
              const faviconUrl = getFaviconForFolder(folder);
              const linkElement = document.querySelector('link[rel="icon"]');
              if (linkElement) {
                linkElement.setAttribute("href", faviconUrl);
              }
            } else {
              console.log("Removing folder ID from localStorage");
              localStorage.removeItem("currentFolderId");
              document.title = "Bookmarks";
              const linkElement = document.querySelector('link[rel="icon"]');
              if (linkElement) {
                linkElement.setAttribute("href", "/logo.ico");
              }
            }
          } else {
            console.log("Selected the same folder, not changing");
          }
        }}
      >
        <Select.Trigger className="text-md inline-flex cursor-pointer items-center justify-between rounded-md focus:outline-none">
          <Select.Value asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 align-middle"
            >
              {currentFolder?.icon && <div>{currentFolder?.icon}</div>}
              <span className="font-medium">{currentFolder?.name}</span>
            </motion.div>
          </Select.Value>
          {currentFolder && (
            <Select.Icon className="ml-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ChevronDownIcon
                  className={`h-4 w-4 transform text-zinc-500 transition-transform duration-200 ${
                    selectOpen ? "rotate-180" : ""
                  }`}
                />
              </motion.div>
            </Select.Icon>
          )}
        </Select.Trigger>

        <Select.Portal>
          <Select.Content position="popper" sideOffset={10} alignOffset={-10}>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-black/10 bg-black/5 p-1 align-middle text-sm text-black no-underline backdrop-blur-lg dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <Select.Viewport className="flex flex-col">
                {folders?.map((folder, index) => (
                  <Select.Item
                    key={folder.id}
                    value={folder.id}
                    className={`mb-1 cursor-pointer rounded-md px-3 py-2 align-middle outline-none transition hover:bg-black/20 dark:hover:bg-white/20 ${
                      folder.id === currentFolder?.id
                        ? "bg-black/10 dark:bg-white/10"
                        : ""
                    }`}
                  >
                    <Select.ItemText>
                      <motion.div className="flex items-center justify-between gap-8">
                        <motion.div className="flex items-center gap-2.5 align-middle">
                          {folder?.icon && (
                            <div className="">{folder?.icon}</div>
                          )}
                          <span className="font-medium">
                            {folder?.name}
                            <span className="self-center text-xs font-normal text-gray-500 ml-2">
                              {folder._count?.bookmarks ?? 0}
                            </span>
                          </span>
                        </motion.div>
                        {folder.id === currentFolder?.id ? (
                          <CheckIcon className="mr-0.5 h-4 w-4" />
                        ) : (
                          <Hotkey key1={String(index + 1)} />
                        )}
                      </motion.div>
                    </Select.ItemText>
                  </Select.Item>
                ))}

                <div className="mx-1">
                  <Separator />
                </div>

                {/*CREATE FOLDER MODAL*/}
                <Dialog.Root
                  open={isNewFolderModalOpen}
                  onOpenChange={(change) => {
                    setSelectOpen(false);
                    setIsNewFolderModalOpen(change);
                  }}
                >
                  <Dialog.Trigger asChild>
                    <motion.div className="z-[999] mt-1 cursor-pointer rounded-md py-2 pl-[0.59rem] pr-3 align-middle outline-none transition hover:bg-black/20 dark:hover:bg-white/20">
                      <div
                        onClick={() => setIsNewFolderModalOpen(true)}
                        className="flex items-center justify-between gap-5"
                      >
                        <div className="flex items-center font-medium">
                          <PlusIcon className="ml-[0.1rem] h-4 w-4" />
                          <span className="ml-3">New folder</span>
                        </div>
                        <Hotkey key1="n" />
                      </div>
                    </motion.div>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <motion.div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlayShow">
                      <Dialog.Content className="fixed left-[50%] top-[50%] z-[10000] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow sm:w-[50vw] md:w-[30vw] lg:w-[25vw]">
                        <CreateFolder
                          onSuccess={() => setIsNewFolderModalOpen(false)}
                        />
                      </Dialog.Content>
                    </motion.div>
                  </Dialog.Portal>
                </Dialog.Root>

                <Dialog.Root
                  open={isDeleteFolderModalOpen}
                  onOpenChange={(change) => {
                    setSelectOpen(false);
                    setIsDeleteFolderModalOpen(change);
                  }}
                >
                  <Dialog.Trigger asChild>
                    <motion.div className="z-[999] mt-1 cursor-pointer rounded-md py-2 pl-[0.59rem] pr-3 align-middle outline-none transition hover:bg-red-500/20 dark:hover:bg-red-500/20">
                      <div
                        onClick={() => setIsDeleteFolderModalOpen(true)}
                        className="flex items-center justify-between gap-5"
                      >
                        <div className="flex items-center font-medium">
                          <Trash className="ml-[0.1rem] h-4 w-4 text-red-500" />
                          <span className="ml-3 text-red-500">Delete</span>
                        </div>
                        <Hotkey red key1="x" />
                      </div>
                    </motion.div>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md data-[state=open]:animate-overlayShow" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-[10000] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none data-[state=open]:animate-contentShow sm:w-[50vw] md:w-[30vw] lg:w-[25vw]">
                      <DeleteFolder
                        onCancel={() => setIsDeleteFolderModalOpen(false)}
                        onSuccess={() => setIsDeleteFolderModalOpen(false)}
                      />
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </Select.Viewport>
            </motion.div>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </>
  );
};
