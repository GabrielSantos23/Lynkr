import { motion } from "framer-motion";
import React from "react";
import type { RefObject } from "react";

import { useAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { FolderDropdown } from "./bookmark_components/FolderDropdown";
import { ShareDropdown } from "./bookmark_components/ShareDropdown";
import { ProfileDropdown } from "./bookmark_components/ProfileDropdown";
import { TourStep } from "./guided-tour";

import {
  bookmarksAtom,
  currentFolderAtom,
  currentPageAtom,
  foldersAtom,
  isDeleteFolderModalOpenAtom,
  isNewFolderModalOpenAtom,
  isOpenAtom,
  folderDropdownOpenAtom,
  openHeaderPopoverAtom,
} from "./helpers/atoms";
import { authClient } from "@/lib/auth-client";
import { getFaviconForFolder } from "@/lib/utils";

type InputRefType = RefObject<HTMLInputElement | null>;

export const Header = ({ inputRef }: { inputRef: InputRefType }) => {
  const [folders] = useAtom(foldersAtom);
  const [, setIsOpen] = useAtom(isOpenAtom);
  const [, setBookmarks] = useAtom(bookmarksAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [, setCurrentPage] = useAtom(currentPageAtom);
  const { data: session } = authClient.useSession();
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useAtom(
    isNewFolderModalOpenAtom
  );

  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useAtom(
    isDeleteFolderModalOpenAtom
  );

  const [folderDropdownOpen, setFolderDropdownOpen] = useAtom(
    folderDropdownOpenAtom
  );

  const [openHeaderPopover, setOpenHeaderPopover] = useAtom(
    openHeaderPopoverAtom
  );

  useHotkeys(
    "f",
    () => {
      setFolderDropdownOpen((open) => !open);
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    "n",
    () => {
      setIsNewFolderModalOpen(!isNewFolderModalOpen);
      setIsDeleteFolderModalOpen(false);
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    "x",
    () => {
      setIsDeleteFolderModalOpen(!isDeleteFolderModalOpen);
      setIsNewFolderModalOpen(false);
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    "1,2,3,4,5,6,7,8,9",
    (event) => {
      if (
        document.activeElement === inputRef.current ||
        !folders ||
        event.key === " "
      ) {
        return;
      }

      const pressedNumber = parseInt(event.key, 10);
      if (pressedNumber > 0 && pressedNumber <= folders.length) {
        const folder = folders[pressedNumber - 1];
        if (folder && folder.id !== currentFolder?.id) {
          setIsOpen(false);
          setBookmarks(null);
          setCurrentPage(1);
          setFolderDropdownOpen(false);
          setCurrentFolder(folder);
          localStorage.setItem("currentFolderId", folder.id);

          document.title = folder.name;
          const faviconUrl = getFaviconForFolder(folder);
          const linkElement = document.querySelector('link[rel="icon"]');
          if (linkElement) {
            linkElement.setAttribute("href", faviconUrl);
          }
        }
      }
    },
    { enableOnFormTags: false },
    [folders, currentFolder]
  );

  useHotkeys(
    "s",
    () => {
      setOpenHeaderPopover((prev) => (prev === "share" ? null : "share"));
    },
    { enableOnFormTags: false }
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex w-full ${
        session?.user ? "" : "hidden"
      } flex-row items-center justify-between px-3 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6`}
    >
      <TourStep
        id="folder-dropdown"
        title="Folders"
        content="Switch between your bookmark folders here."
        order={1}
        position="bottom"
      >
        <FolderDropdown />
      </TourStep>
      <div className="flex flex-row gap-1 sm:gap-2">
        <TourStep
          id="share-dropdown"
          title="Share your folder"
          content="Make a folder public or copy the magic link to share with friends."
          order={4}
          position="bottom"
        >
          <ShareDropdown />
        </TourStep>
        <TourStep
          id="profile-dropdown"
          title="Profile & settings"
          content="Change layout, theme, and other settings or sign out."
          order={5}
          position="bottom"
        >
          <ProfileDropdown />
        </TourStep>
      </div>
    </motion.div>
  );
};
