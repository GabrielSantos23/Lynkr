import { motion } from "framer-motion";
import React from "react";

import { useAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { FolderDropdown } from "./bookmark_components/FolderDropdown";
import { ShareDropdown } from "./bookmark_components/ShareDropdown";
import { ProfileDropdown } from "./bookmark_components/ProfileDropdown";

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

export const Header = ({
  inputRef,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const [folders] = useAtom(foldersAtom);
  const [, setIsOpen] = useAtom(isOpenAtom);
  const [, setBookmarks] = useAtom(bookmarksAtom);
  const [currentFolder, setCurrentFolder] = useAtom(currentFolderAtom);
  const [, setCurrentPage] = useAtom(currentPageAtom);

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
      className="flex w-full flex-row items-center justify-between px-8 py-6 md:px-12"
    >
      <FolderDropdown />
      <div className="flex flex-row gap-2">
        <ShareDropdown />
        <ProfileDropdown />
      </div>
    </motion.div>
  );
};
