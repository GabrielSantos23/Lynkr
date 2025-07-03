export interface Folder {
  id: string;
  name: string;
  icon: string;
  isShared: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  allowDuplicate: boolean;
  bookmarks?: import("./bookmark").Bookmark[];
}
