import React from "react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onAddClick: () => void;
  bookmarkCount: number;
}

const Header: React.FC<HeaderProps> = ({ onAddClick, bookmarkCount }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Lynkr</h1>
            <p className="text-xs text-primary-100">
              {bookmarkCount} bookmarks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-2 text-xs">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-primary-100">{user.name}</span>
            </div>
          )}

          {/* Add Bookmark Button */}
          <Button
            onClick={onAddClick}
            variant="ghost"
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            title="Add bookmark"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Button>

          {/* Logout Button */}
          {user && (
            <Button
              onClick={logout}
              variant="ghost"
              size="icon"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
