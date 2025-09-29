from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db, test_connection
from models import (
    UserCreate, UserLogin, User, Token, MessageResponse,
    FolderCreate, Folder, FolderUpdate,
    BookmarkCreate, Bookmark, BookmarkUpdate, Tag
)
from auth_service import (
    verify_password, create_access_token, verify_token,
    get_user_by_email, get_user_by_id, create_user
)
from bookmark_service import (
    get_folders_by_user_id, get_folder_by_id, create_folder,
    get_bookmarks_by_user_id, get_bookmarks_by_folder_id, 
    get_bookmark_by_id, create_bookmark
)

app = FastAPI(title="Lynkr Extension API", version="1.0.0")

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), 
                    db: Session = Depends(get_db)) -> dict:
    """Get current authenticated user"""
    token = credentials.credentials
    user_id = verify_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected"
    }

# Authentication endpoints
@app.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        user = create_user(db, user_data.name, user_data.email, user_data.password)
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        return {
            "user": user,
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/auth/login", response_model=dict)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = get_user_by_email(db, login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check password if user has one
    if user.get("password"):
        # Get password from account table
        from sqlalchemy import text
        account_result = db.execute(
            text("SELECT password FROM account WHERE user_id = :user_id AND provider_id = 'credentials'"),
            {"user_id": user["id"]}
        ).fetchone()
        
        if account_result and not verify_password(login_data.password, account_result.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Folder endpoints
@app.get("/folders", response_model=List[Folder])
async def get_folders(current_user: dict = Depends(get_current_user), 
                     db: Session = Depends(get_db)):
    """Get all folders for the current user"""
    folders = get_folders_by_user_id(db, current_user["id"])
    return folders

@app.get("/folders/{folder_id}", response_model=Folder)
async def get_folder(folder_id: str, current_user: dict = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """Get a specific folder"""
    folder = get_folder_by_id(db, folder_id, current_user["id"])
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return folder

@app.post("/folders", response_model=Folder)
async def create_new_folder(folder_data: FolderCreate, 
                          current_user: dict = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """Create a new folder"""
    try:
        folder = create_folder(
            db, 
            current_user["id"], 
            folder_data.name, 
            folder_data.icon,
            folder_data.allow_duplicate,
            folder_data.is_shared
        )
        return folder
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {str(e)}"
        )

# Bookmark endpoints
@app.get("/bookmarks", response_model=List[Bookmark])
async def get_bookmarks(current_user: dict = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Get all bookmarks for the current user"""
    bookmarks = get_bookmarks_by_user_id(db, current_user["id"])
    return bookmarks

@app.get("/bookmarks/folder/{folder_id}", response_model=List[Bookmark])
async def get_bookmarks_by_folder(folder_id: str, 
                                 current_user: dict = Depends(get_current_user),
                                 db: Session = Depends(get_db)):
    """Get all bookmarks for a specific folder"""
    bookmarks = get_bookmarks_by_folder_id(db, folder_id, current_user["id"])
    return bookmarks

@app.get("/bookmarks/{bookmark_id}", response_model=Bookmark)
async def get_bookmark(bookmark_id: str, current_user: dict = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """Get a specific bookmark"""
    bookmark = get_bookmark_by_id(db, bookmark_id, current_user["id"])
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    return bookmark

@app.post("/bookmarks", response_model=Bookmark)
async def create_new_bookmark(bookmark_data: BookmarkCreate,
                            current_user: dict = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """Create a new bookmark"""
    try:
        # Verify folder belongs to user
        folder = get_folder_by_id(db, bookmark_data.folder_id, current_user["id"])
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        bookmark = create_bookmark(
            db,
            current_user["id"],
            bookmark_data.url,
            bookmark_data.title,
            bookmark_data.folder_id,
            bookmark_data.favicon_url,
            bookmark_data.og_image_url,
            bookmark_data.description,
            bookmark_data.is_pinned,
            [tag.dict() for tag in bookmark_data.tags]
        )
        return bookmark
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bookmark: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
