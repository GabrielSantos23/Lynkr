import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { databaseService } from "./services/database";
import { authService } from "./services/auth";
import { bookmarkService } from "./services/bookmark";
import {
  User,
  UserCreate,
  UserLogin,
  FolderCreate,
  BookmarkCreate,
} from "./types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.API_PORT || "8000");
const HOST = process.env.API_HOST || "0.0.0.0";

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Authentication middleware
const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: "Access token required",
      detail: "Invalid authentication credentials",
    });
    return;
  }

  try {
    const userId = authService.verifyToken(token);
    if (!userId) {
      res.status(401).json({
        error: "Invalid token",
        detail: "Invalid authentication credentials",
      });
      return;
    }

    const user = await authService.getUserById(userId);
    if (!user) {
      res.status(401).json({
        error: "User not found",
        detail: "User not found",
      });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Token verification failed",
      detail: "Invalid authentication credentials",
    });
  }
};

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    const dbStatus = await databaseService.testConnection();
    res.json({
      status: dbStatus ? "healthy" : "unhealthy",
      database: dbStatus ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: "Health check failed",
    });
  }
});

// Authentication endpoints
app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const userData: UserCreate = req.body;

    // Check if user already exists
    const existingUser = await authService.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered",
        detail: "Email already registered",
      });
    }

    const user = await authService.createUser(
      userData.name,
      userData.email,
      userData.password
    );

    // Create access token
    const accessToken = authService.createAccessToken({ sub: user.id });

    return res.json({
      user,
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      error: "Registration failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const loginData: UserLogin = req.body;

    const user = await authService.getUserByEmail(loginData.email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        detail: "Invalid email or password",
      });
    }

    // Check password if user has one
    if (user.email_verified) {
      const password = await authService.getUserPassword(user.id);
      if (
        password &&
        !(await authService.verifyPassword(loginData.password, password))
      ) {
        return res.status(401).json({
          error: "Invalid credentials",
          detail: "Invalid email or password",
        });
      }
    }

    // Create access token
    const accessToken = authService.createAccessToken({ sub: user.id });

    return res.json({
      user,
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Login failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/auth/me", authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  res.json(user);
});

// Folder endpoints
app.get("/folders", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const folders = await bookmarkService.getFoldersByUserId(user.id);
    return res.json(folders);
  } catch (error) {
    console.error("Get folders error:", error);
    return res.status(500).json({
      error: "Failed to get folders",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get(
  "/folders/:folderId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const { folderId } = req.params;

      if (!folderId) {
        return res.status(400).json({
          error: "Folder ID required",
          detail: "Folder ID is required",
        });
      }

      const folder = await bookmarkService.getFolderById(folderId, user.id);
      if (!folder) {
        return res.status(404).json({
          error: "Folder not found",
          detail: "Folder not found",
        });
      }

      return res.json(folder);
    } catch (error) {
      console.error("Get folder error:", error);
      return res.status(500).json({
        error: "Failed to get folder",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.post("/folders", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User;
    const folderData: FolderCreate = req.body;

    const folder = await bookmarkService.createFolder(
      user.id,
      folderData.name,
      folderData.icon || "📁",
      folderData.allow_duplicate ?? true,
      folderData.is_shared ?? false
    );

    return res.json(folder);
  } catch (error) {
    console.error("Create folder error:", error);
    return res.status(500).json({
      error: "Failed to create folder",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Bookmark endpoints
app.get(
  "/bookmarks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const bookmarks = await bookmarkService.getBookmarksByUserId(user.id);
      return res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      return res.status(500).json({
        error: "Failed to get bookmarks",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.get(
  "/bookmarks/folder/:folderId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const { folderId } = req.params;

      if (!folderId) {
        return res.status(400).json({
          error: "Folder ID required",
          detail: "Folder ID is required",
        });
      }

      const bookmarks = await bookmarkService.getBookmarksByFolderId(
        folderId,
        user.id
      );
      return res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks by folder error:", error);
      return res.status(500).json({
        error: "Failed to get bookmarks",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.get(
  "/bookmarks/:bookmarkId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const { bookmarkId } = req.params;

      if (!bookmarkId) {
        return res.status(400).json({
          error: "Bookmark ID required",
          detail: "Bookmark ID is required",
        });
      }

      const bookmark = await bookmarkService.getBookmarkById(
        bookmarkId,
        user.id
      );
      if (!bookmark) {
        return res.status(404).json({
          error: "Bookmark not found",
          detail: "Bookmark not found",
        });
      }

      return res.json(bookmark);
    } catch (error) {
      console.error("Get bookmark error:", error);
      return res.status(500).json({
        error: "Failed to get bookmark",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

app.post(
  "/bookmarks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const bookmarkData: BookmarkCreate = req.body;

      // Verify folder belongs to user
      const folder = await bookmarkService.getFolderById(
        bookmarkData.folder_id,
        user.id
      );
      if (!folder) {
        return res.status(404).json({
          error: "Folder not found",
          detail: "Folder not found",
        });
      }

      const bookmark = await bookmarkService.createBookmark(
        user.id,
        bookmarkData.url,
        bookmarkData.title,
        bookmarkData.folder_id,
        bookmarkData.favicon_url,
        bookmarkData.og_image_url,
        bookmarkData.description,
        bookmarkData.is_pinned ?? false,
        bookmarkData.tags || []
      );

      return res.json(bookmark);
    } catch (error) {
      console.error("Create bookmark error:", error);
      return res.status(500).json({
        error: "Failed to create bookmark",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    detail:
      process.env.DEBUG === "true" ? error.message : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    detail: "The requested resource was not found",
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await databaseService.testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await databaseService.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await databaseService.close();
  process.exit(0);
});

// Export app for testing
export { app };

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}
