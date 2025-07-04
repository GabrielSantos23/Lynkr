export interface Bookmark {
  id: string;
  createdAt: Date;
  title: string;
  url: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  loading?: boolean;
  onClick?: () => void;
  isPinned?: boolean;
  tags?: { name: string; color: string }[];
}
