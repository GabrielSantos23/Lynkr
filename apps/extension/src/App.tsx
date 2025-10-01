import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import BookmarkList from "./components/BookmarkList";
import AddBookmark from "./components/AddBookmark";
import LoginPage from "./components/LoginPage";
import AuthLoading from "./components/AuthLoading";
import { Bookmark } from "./types/bookmark";

const AppContent: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { user, isLoading, login } = useAuth();

  useEffect(() => {
    chrome.storage.local.get(["bookmarks"], (result) => {
      if (result.bookmarks) {
        setBookmarks(result.bookmarks);
      }
    });
  }, []);

  const addBookmark = (bookmark: Omit<Bookmark, "id" | "createdAt">) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);

    chrome.storage.local.set({ bookmarks: updatedBookmarks });
    setIsAdding(false);
  };

  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    setBookmarks(updatedBookmarks);
    chrome.storage.local.set({ bookmarks: updatedBookmarks });
  };

  const openBookmark = (url: string) => {
    chrome.tabs.create({ url });
  };

  const handleLogin = async () => {
    await login();
  };

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="w-full h-full bg-background rounded-xl overflow-hidden">
      <Header
        onAddClick={() => setIsAdding(true)}
        bookmarkCount={bookmarks.length}
      />

      <main className="p-4">
        {isAdding ? (
          <AddBookmark
            onSave={addBookmark}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDelete={deleteBookmark}
            onOpen={openBookmark}
          />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
