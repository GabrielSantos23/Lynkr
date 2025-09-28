# Lynkr Extension API

This Python FastAPI application provides endpoints for the Lynkr browser extension to manage bookmarks and folders.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Folders**: Create, read, and manage bookmark folders
- **Bookmarks**: Create, read, and manage bookmarks with encryption
- **Security**: All sensitive data is encrypted using AES-GCM encryption
- **Database**: PostgreSQL integration with SQLAlchemy

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENCRYPTION_KEY=your-base64-encryption-key
```

3. Run the API server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Folders

- `GET /folders` - Get all folders for current user
- `GET /folders/{folder_id}` - Get specific folder
- `POST /folders` - Create new folder

### Bookmarks

- `GET /bookmarks` - Get all bookmarks for current user
- `GET /bookmarks/folder/{folder_id}` - Get bookmarks by folder
- `GET /bookmarks/{bookmark_id}` - Get specific bookmark
- `POST /bookmarks` - Create new bookmark

### Health Check

- `GET /health` - Check API and database status

## Testing

Run the test suite to validate all endpoints:

```bash
python test_api.py
```

This will test all API endpoints and provide a detailed report of what works and what doesn't.

## Encryption

The API uses AES-GCM encryption to protect sensitive data:

- Folder names are encrypted
- Bookmark titles, URLs, and descriptions are encrypted
- Uses the same encryption key format as the TypeScript backend
- Backward compatible with existing encrypted data

## Database Schema

The API works with the existing PostgreSQL schema:

- `user` table for user accounts
- `folder` table for bookmark folders
- `bookmark` table for bookmarks
- `account` table for authentication providers
- `session` table for user sessions

