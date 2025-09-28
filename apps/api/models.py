from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    email_verified: bool
    image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# Folder Models
class FolderCreate(BaseModel):
    name: str
    icon: str = "📁"
    allow_duplicate: bool = True
    is_shared: bool = False

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    allow_duplicate: Optional[bool] = None
    is_shared: Optional[bool] = None

class Folder(BaseModel):
    id: str
    name: str
    slug: str
    icon: str
    allow_duplicate: bool
    is_shared: bool
    user_id: str
    created_at: datetime
    updated_at: datetime

# Bookmark Models
class Tag(BaseModel):
    name: str
    color: str

class BookmarkCreate(BaseModel):
    url: str
    title: str
    folder_id: str
    favicon_url: Optional[str] = None
    og_image_url: Optional[str] = None
    description: Optional[str] = None
    is_pinned: bool = False
    tags: List[Tag] = []

class BookmarkUpdate(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    folder_id: Optional[str] = None
    favicon_url: Optional[str] = None
    og_image_url: Optional[str] = None
    description: Optional[str] = None
    is_pinned: Optional[bool] = None
    tags: Optional[List[Tag]] = None

class Bookmark(BaseModel):
    id: str
    url: str
    title: str
    favicon_url: Optional[str] = None
    og_image_url: Optional[str] = None
    description: Optional[str] = None
    folder_id: str
    is_pinned: bool
    tags: List[Tag]
    created_at: datetime
    updated_at: datetime

# Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

