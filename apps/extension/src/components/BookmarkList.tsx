import React from "react";
import BookmarkItem from "./BookmarkItem";
import EmptyState from "./EmptyState";
import { Bookmark } from "../types/bookmark";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onOpen: (url: string) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onDelete,
  onOpen,
}) => {
  if (bookmarks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
};

export default BookmarkList;

