import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Header } from "@/components/header";
import { useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import CreateFirstFolder from "@/components/bookmark_components/CreateFirstFolder";

const getFoldersFn = async (userId: string) => {
  const response = await fetch(`/api/folders?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch folders.");
  return response.json();
};

export const Route = createFileRoute("/bookmarks")({
  component: RouteComponent,
});

function RouteComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { data: folders, isFetched: foldersFetched } = useQuery({
    queryKey: ["folders", userId],
    queryFn: () => getFoldersFn(userId!),
    enabled: !!userId,
  });

  const handleBookmarkNavigation = useMemo(() => {
    if (!foldersFetched || !folders || !userId) {
      return null;
    }

    if (folders.length > 0 && pathname === "/bookmarks") {
      const firstFolderSlug = folders[0].slug;
      navigate({ to: `/bookmarks/${firstFolderSlug}` });
      return null;
    }

    if (folders.length === 0) {
      return <CreateFirstFolder />;
    }

    return null;
  }, [foldersFetched, folders, userId, pathname, navigate]);

  return (
    <div className="">
      <div className="flex flex-1 z-1 overflow-auto relative">
        <div className="p-4 w-full">
          {handleBookmarkNavigation}

          <Outlet />
        </div>
      </div>
    </div>
  );
}
