// User Types
export interface UserCreate {
  name: string;
  email: string;
  password?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image?: string | undefined;
  created_at: Date;
  updated_at: Date;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Folder Types
export interface FolderCreate {
  name: string;
  icon?: string;
  allow_duplicate?: boolean;
  is_shared?: boolean;
}

export interface FolderUpdate {
  name?: string;
  icon?: string;
  allow_duplicate?: boolean;
  is_shared?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  slug: string;
  icon: string;
  allow_duplicate: boolean;
  is_shared: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

// Bookmark Types
export interface Tag {
  name: string;
  color: string;
}

export interface BookmarkCreate {
  url: string;
  title: string;
  folder_id: string;
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
  is_pinned?: boolean;
  tags?: Tag[];
}

export interface BookmarkUpdate {
  url?: string;
  title?: string;
  folder_id?: string;
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
  is_pinned?: boolean;
  tags?: Tag[];
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon_url?: string | undefined;
  og_image_url?: string | undefined;
  description?: string | undefined;
  folder_id: string;
  is_pinned: boolean;
  tags: Tag[];
  created_at: Date;
  updated_at: Date;
}

// Response Types
export interface MessageResponse {
  message: string;
  success?: boolean;
}

// Database Types
export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseFolder {
  id: string;
  name: string;
  slug: string;
  icon: string;
  allow_duplicate: boolean;
  is_shared: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseBookmark {
  id: string;
  url: string;
  title: string;
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
  folder_id: string;
  is_pinned: boolean;
  tags: string; // JSON string
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseAccount {
  id: string;
  account_id: string;
  provider_id: string;
  user_id: string;
  password?: string;
  created_at: Date;
  updated_at: Date;
}

// JWT Payload
export interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
}

// Environment Variables
export interface Environment {
  DATABASE_URL: string;
  SECRET_KEY: string;
  ALGORITHM: string;
  ACCESS_TOKEN_EXPIRE_MINUTES: number;
  API_HOST: string;
  API_PORT: number;
  DEBUG: boolean;
  ALLOWED_ORIGINS: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  ENCRYPTION_KEY: string;
}
