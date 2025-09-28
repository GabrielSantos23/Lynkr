import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type SmallBookmark = {
  id: string;
  url: string;
  title: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  createdAt: Date;
};

type FolderWithCount = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  allowDuplicate: boolean;
  isShared: boolean;
  createdAt: Date;
  _count?: {
    bookmarks: number;
  };
};

export const isOpenAtom = atom(false);
export const showMonthsAtom = atomWithStorage("showMonths", true);
export const isNewFolderModalOpenAtom = atom<boolean>(false);
export const isDeleteFolderModalOpenAtom = atom<boolean>(false);
export const viewStyleAtom = atomWithStorage<"expanded" | "compact">(
  "viewStyle",
  "compact"
);
export const currentPageAtom = atom(1);
export const currentFolderAtom = atom<FolderWithCount | null>(null);
export const foldersAtom = atom<FolderWithCount[] | null>(null);
export const bookmarksAtom = atom<SmallBookmark[] | null>(null);
export const bookmarksFilteredAtom = atom<SmallBookmark[] | null>(null);
export const totalBookmarksAtom = atom<number | null>(null);
export const openHeaderPopoverAtom = atom<"share" | "settings" | null>(null);
export const folderDropdownOpenAtom = atom(false);
