import React from "react";
import { Bookmark } from "../types/bookmark";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onOpen: (url: string) => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  onDelete,
  onOpen,
}) => {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return "";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-3">
        <img
          src={getFaviconUrl(bookmark.url)}
          alt=""
          className="w-4 h-4 mt-1 flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {bookmark.title}
          </h3>

          <p className="text-xs text-gray-500 truncate mt-1">{bookmark.url}</p>

          {bookmark.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {formatDate(bookmark.createdAt)}
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => onOpen(bookmark.url)}
                className="text-primary-600 hover:text-primary-700 p-1 rounded"
                title="Open bookmark"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>

              <button
                onClick={() => onDelete(bookmark.id)}
                className="text-red-500 hover:text-red-600 p-1 rounded"
                title="Delete bookmark"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkItem;

