import React from "react";

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No bookmarks yet
      </h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Start building your collection by adding your first bookmark
      </p>

      <div className="text-xs text-gray-400">
        Click the + button to get started
      </div>
    </div>
  );
};

export default EmptyState;

