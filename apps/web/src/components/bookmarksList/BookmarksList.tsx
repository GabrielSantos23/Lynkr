import { motion } from "framer-motion";
import { CompactBookmark } from "./CompactBookmark";
import { ExpandedBookmark } from "./ExpandedBookmark";

export const Index = ({
  bookmarks,
  showMonths,
  viewStyle,
  handleDeleteBookmark,
  isPrivatePage,
}: {
  bookmarks: {
    createdAt: Date;
    id: string;
    title: string;
    url: string;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    loading?: boolean;
    onClick?: () => void;
  }[];
  showMonths: boolean;
  viewStyle: "expanded" | "compact";
  handleDeleteBookmark?: (id: string) => void;
  isPrivatePage: boolean;
}) => {
  let groupedBookmarks: Record<
    string,
    {
      createdAt: Date;
      id: string;
      title: string;
      url: string;
      faviconUrl: string | null;
      ogImageUrl: string | null;
    }[]
  > = {};

  if (showMonths) {
    groupedBookmarks = bookmarks.reduce(
      (result, current) => {
        const date = new Date(current.createdAt);
        const month = new Intl.DateTimeFormat("en-US", {
          month: "long",
        }).format(date);
        if (!result[month]) {
          result[month] = [];
        }
        result[month]?.push(current);
        return result;
      },
      {} as Record<
        string,
        {
          createdAt: Date;
          id: string;
          title: string;
          url: string;
          faviconUrl: string | null;
          ogImageUrl: string | null;
        }[]
      >
    );
  }

  return showMonths ? (
    groupedBookmarks && (
      <>
        {Object.keys(groupedBookmarks).map((month) => (
          <motion.div key={month}>
            <motion.h3
              initial={{
                opacity: 0,
              }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="pb-2 pl-3 pt-4 text-2xl font-bold text-black dark:text-white"
            >
              {month}
            </motion.h3>
            {groupedBookmarks[month]?.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                id={bookmark.id}
                initial={{
                  opacity: bookmark.id === "temp" ? 0 : 1,
                  y: bookmark.id === "temp" ? -10 : 0,
                }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
              >
                {viewStyle === "compact" ? (
                  <CompactBookmark
                    onRemove={handleDeleteBookmark}
                    bookmark={bookmark}
                    isPrivatePage={isPrivatePage}
                  />
                ) : (
                  <ExpandedBookmark
                    onRemove={handleDeleteBookmark}
                    bookmark={bookmark}
                    isPrivatePage={isPrivatePage}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        ))}
      </>
    )
  ) : (
    <div className="pt-2">
      {bookmarks.map((bookmark) => (
        <motion.div
          key={bookmark.id}
          id={bookmark.id}
          initial={{
            opacity: bookmark.id === "temp" ? 0 : 1,
            y: bookmark.id === "temp" ? -10 : 0,
          }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewStyle === "compact" ? (
            <CompactBookmark
              onRemove={handleDeleteBookmark}
              bookmark={bookmark}
              isPrivatePage={isPrivatePage}
            />
          ) : (
            <ExpandedBookmark
              onRemove={handleDeleteBookmark}
              bookmark={bookmark}
              isPrivatePage={isPrivatePage}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};
