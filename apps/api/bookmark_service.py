from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
import uuid
import json
from auth_service import generate_folder_id, generate_bookmark_id, generate_slug
from encryption import encryption_service

def get_folders_by_user_id(db: Session, user_id: str) -> List[dict]:
    """Get all folders for a user"""
    try:
        result = db.execute(
            text("SELECT * FROM folder WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        
        folders = []
        for row in result:
            folder_dict = dict(row._mapping)
            # Folder names are now stored in plain text
            folders.append(folder_dict)
        
        return folders
    except Exception as e:
        print(f"Error getting folders: {e}")
        return []

def get_folder_by_id(db: Session, folder_id: str, user_id: str) -> Optional[dict]:
    """Get a specific folder by ID"""
    try:
        result = db.execute(
            text("SELECT * FROM folder WHERE id = :folder_id AND user_id = :user_id"),
            {"folder_id": folder_id, "user_id": user_id}
        ).fetchone()
        
        if result:
            folder_dict = dict(result._mapping)
            # Folder names are now stored in plain text
            return folder_dict
        return None
    except Exception as e:
        print(f"Error getting folder: {e}")
        return None

def create_folder(db: Session, user_id: str, name: str, icon: str = "📁", 
                 allow_duplicate: bool = True, is_shared: bool = False) -> dict:
    """Create a new folder"""
    folder_id = generate_folder_id()
    slug = generate_slug(name)
    now = datetime.utcnow()
    
    # Folder names are now stored in plain text
    
    try:
        db.execute(
            text("""
                INSERT INTO folder (id, name, slug, icon, allow_duplicate, is_shared, user_id, created_at, updated_at)
                VALUES (:id, :name, :slug, :icon, :allow_duplicate, :is_shared, :user_id, :created_at, :updated_at)
            """),
            {
                "id": folder_id,
                "name": name,
                "slug": slug,
                "icon": icon,
                "allow_duplicate": allow_duplicate,
                "is_shared": is_shared,
                "user_id": user_id,
                "created_at": now,
                "updated_at": now
            }
        )
        db.commit()
        
        return {
            "id": folder_id,
            "name": name,  # Return decrypted name
            "slug": slug,
            "icon": icon,
            "allow_duplicate": allow_duplicate,
            "is_shared": is_shared,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating folder: {e}")
        raise e

def get_bookmarks_by_user_id(db: Session, user_id: str) -> List[dict]:
    """Get all bookmarks for a user"""
    try:
        result = db.execute(
            text("""
                SELECT b.*, f.name as folder_name, f.slug as folder_slug
                FROM bookmark b
                JOIN folder f ON b.folder_id = f.id
                WHERE f.user_id = :user_id
                ORDER BY b.created_at DESC
            """),
            {"user_id": user_id}
        ).fetchall()
        
        bookmarks = []
        for row in result:
            bookmark_dict = dict(row._mapping)
            # Decrypt bookmark data
            bookmark_dict["title"] = encryption_service.decrypt(bookmark_dict["title"])
            bookmark_dict["url"] = encryption_service.decrypt(bookmark_dict["url"])
            if bookmark_dict.get("description"):
                bookmark_dict["description"] = encryption_service.decrypt(bookmark_dict["description"])
            # Folder names are now stored in plain text
            bookmarks.append(bookmark_dict)
        
        return bookmarks
    except Exception as e:
        print(f"Error getting bookmarks: {e}")
        return []

def get_bookmarks_by_folder_id(db: Session, folder_id: str, user_id: str) -> List[dict]:
    """Get all bookmarks for a specific folder"""
    try:
        result = db.execute(
            text("""
                SELECT b.*, f.name as folder_name, f.slug as folder_slug
                FROM bookmark b
                JOIN folder f ON b.folder_id = f.id
                WHERE b.folder_id = :folder_id AND f.user_id = :user_id
                ORDER BY b.created_at DESC
            """),
            {"folder_id": folder_id, "user_id": user_id}
        ).fetchall()
        
        bookmarks = []
        for row in result:
            bookmark_dict = dict(row._mapping)
            # Decrypt bookmark data
            bookmark_dict["title"] = encryption_service.decrypt(bookmark_dict["title"])
            bookmark_dict["url"] = encryption_service.decrypt(bookmark_dict["url"])
            if bookmark_dict.get("description"):
                bookmark_dict["description"] = encryption_service.decrypt(bookmark_dict["description"])
            # Folder names are now stored in plain text
            bookmarks.append(bookmark_dict)
        
        return bookmarks
    except Exception as e:
        print(f"Error getting bookmarks by folder: {e}")
        return []

def get_bookmark_by_id(db: Session, bookmark_id: str, user_id: str) -> Optional[dict]:
    """Get a specific bookmark by ID"""
    try:
        result = db.execute(
            text("""
                SELECT b.*, f.name as folder_name, f.slug as folder_slug
                FROM bookmark b
                JOIN folder f ON b.folder_id = f.id
                WHERE b.id = :bookmark_id AND f.user_id = :user_id
            """),
            {"bookmark_id": bookmark_id, "user_id": user_id}
        ).fetchone()
        
        if result:
            bookmark_dict = dict(result._mapping)
            # Decrypt bookmark data
            bookmark_dict["title"] = encryption_service.decrypt(bookmark_dict["title"])
            bookmark_dict["url"] = encryption_service.decrypt(bookmark_dict["url"])
            if bookmark_dict.get("description"):
                bookmark_dict["description"] = encryption_service.decrypt(bookmark_dict["description"])
            # Folder names are now stored in plain text
            return bookmark_dict
        return None
    except Exception as e:
        print(f"Error getting bookmark: {e}")
        return None

def create_bookmark(db: Session, user_id: str, url: str, title: str, folder_id: str,
                   favicon_url: Optional[str] = None, og_image_url: Optional[str] = None,
                   description: Optional[str] = None, is_pinned: bool = False,
                   tags: List[dict] = None) -> dict:
    """Create a new bookmark"""
    bookmark_id = generate_bookmark_id()
    now = datetime.utcnow()
    
    if tags is None:
        tags = []
    
    # Encrypt bookmark data
    encrypted_title = encryption_service.encrypt(title)
    encrypted_url = encryption_service.encrypt(url)
    encrypted_description = encryption_service.encrypt(description) if description else None
    
    try:
        db.execute(
            text("""
                INSERT INTO bookmark (id, url, title, favicon_url, og_image_url, description, 
                                    folder_id, is_pinned, tags, created_at, updated_at)
                VALUES (:id, :url, :title, :favicon_url, :og_image_url, :description, 
                        :folder_id, :is_pinned, :tags, :created_at, :updated_at)
            """),
            {
                "id": bookmark_id,
                "url": encrypted_url,
                "title": encrypted_title,
                "favicon_url": favicon_url,
                "og_image_url": og_image_url,
                "description": encrypted_description,
                "folder_id": folder_id,
                "is_pinned": is_pinned,
                "tags": json.dumps(tags),
                "created_at": now,
                "updated_at": now
            }
        )
        db.commit()
        
        return {
            "id": bookmark_id,
            "url": url,  # Return decrypted URL
            "title": title,  # Return decrypted title
            "favicon_url": favicon_url,
            "og_image_url": og_image_url,
            "description": description,  # Return decrypted description
            "folder_id": folder_id,
            "is_pinned": is_pinned,
            "tags": tags,
            "created_at": now,
            "updated_at": now
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating bookmark: {e}")
        raise e
