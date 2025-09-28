import os
import secrets
import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Truncate password to 72 bytes as required by bcrypt
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Truncate password to 72 bytes as required by bcrypt
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user ID"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None

def generate_user_id() -> str:
    """Generate a unique user ID"""
    return str(uuid.uuid4())

def generate_folder_id() -> str:
    """Generate a unique folder ID"""
    return str(uuid.uuid4())

def generate_bookmark_id() -> str:
    """Generate a unique bookmark ID"""
    return str(uuid.uuid4())

def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from name"""
    import re
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def get_user_by_email(db: Session, email: str) -> Optional[dict]:
    """Get user by email from database"""
    try:
        result = db.execute(
            text("SELECT * FROM \"user\" WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if result:
            return dict(result._mapping)
        return None
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None

def get_user_by_id(db: Session, user_id: str) -> Optional[dict]:
    """Get user by ID from database"""
    try:
        result = db.execute(
            text("SELECT * FROM \"user\" WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        
        if result:
            return dict(result._mapping)
        return None
    except Exception as e:
        print(f"Error getting user by ID: {e}")
        return None

def create_user(db: Session, name: str, email: str, password: Optional[str] = None) -> dict:
    """Create a new user"""
    user_id = generate_user_id()
    now = datetime.utcnow()
    
    # Hash password if provided
    hashed_password = None
    if password:
        hashed_password = get_password_hash(password)
    
    try:
        db.execute(
            text("""
                INSERT INTO \"user\" (id, name, email, email_verified, created_at, updated_at)
                VALUES (:id, :name, :email, :email_verified, :created_at, :updated_at)
            """),
            {
                "id": user_id,
                "name": name,
                "email": email,
                "email_verified": False,
                "created_at": now,
                "updated_at": now
            }
        )
        
        # Create account entry if password provided
        if password and hashed_password:
            account_id = str(uuid.uuid4())
            db.execute(
                text("""
                    INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
                    VALUES (:id, :account_id, :provider_id, :user_id, :password, :created_at, :updated_at)
                """),
                {
                    "id": account_id,
                    "account_id": user_id,
                    "provider_id": "credentials",
                    "user_id": user_id,
                    "password": hashed_password,
                    "created_at": now,
                    "updated_at": now
                }
            )
        
        db.commit()
        
        return {
            "id": user_id,
            "name": name,
            "email": email,
            "email_verified": False,
            "created_at": now,
            "updated_at": now
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        raise e
