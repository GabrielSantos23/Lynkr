# Lynkr API - TypeScript Version

A TypeScript rewrite of the Lynkr Extension API, built with Express.js and PostgreSQL.

## Features

- 🔐 JWT-based authentication
- 📁 Folder management
- 🔖 Bookmark management with encryption
- 🛡️ Rate limiting and security headers
- 📊 Health check endpoints
- 🔒 Data encryption for sensitive information
- 🧪 Comprehensive testing

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Encryption**: AES-GCM
- **Validation**: Joi
- **Testing**: Jest

## Project Structure

```
src/
├── services/          # Business logic services
│   ├── auth.ts       # Authentication service
│   ├── bookmark.ts   # Bookmark management
│   ├── database.ts   # Database connection
│   └── encryption.ts # Data encryption
├── types/            # TypeScript type definitions
│   └── index.ts      # All type definitions
├── utils/            # Utility functions
│   └── validation.ts # Request validation schemas
└── index.ts          # Main application entry point
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Build the project:

```bash
npm run build
```

## Development

Start the development server:

```bash
npm run dev
```

## Production

Build and start the production server:

```bash
npm run build
npm start
```

## Environment Variables

| Variable                      | Description                    | Required |
| ----------------------------- | ------------------------------ | -------- |
| `DATABASE_URL`                | PostgreSQL connection string   | Yes      |
| `SECRET_KEY`                  | JWT secret key                 | Yes      |
| `ALGORITHM`                   | JWT algorithm (default: HS256) | No       |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time          | No       |
| `API_HOST`                    | Server host (default: 0.0.0.0) | No       |
| `API_PORT`                    | Server port (default: 8000)    | No       |
| `DEBUG`                       | Debug mode (default: false)    | No       |
| `ALLOWED_ORIGINS`             | CORS allowed origins           | No       |
| `ENCRYPTION_KEY`              | Base64 encoded encryption key  | Yes      |

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Folders

- `GET /folders` - Get all user folders
- `GET /folders/:id` - Get specific folder
- `POST /folders` - Create new folder

### Bookmarks

- `GET /bookmarks` - Get all user bookmarks
- `GET /bookmarks/folder/:id` - Get bookmarks by folder
- `GET /bookmarks/:id` - Get specific bookmark
- `POST /bookmarks` - Create new bookmark

### Health

- `GET /health` - Health check endpoint

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Linting

Run linter:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Data Encryption**: AES-GCM encryption for sensitive data
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi schema validation

## Database Schema

The API expects the following PostgreSQL tables:

- `user` - User accounts
- `account` - Authentication accounts
- `folder` - Bookmark folders
- `bookmark` - Bookmarks with encrypted data

## Migration from Python API

This TypeScript version maintains API compatibility with the original Python FastAPI version. The endpoints, request/response formats, and authentication flow remain the same.

## License

MIT
