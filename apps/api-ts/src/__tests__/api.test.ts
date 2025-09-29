import request from "supertest";
import express from "express";

// Set test environment before importing the app
process.env.NODE_ENV = "test";

import { app } from "../index";

describe("API Tests", () => {
  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("database");
    });
  });

  describe("Authentication", () => {
    it("should register a new user", async () => {
      const userData = {
        name: "Test User",
        email: `test1-${Date.now()}@example.com`,
        password: "password123",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("token_type", "bearer");
    });

    it("should reject duplicate email registration", async () => {
      const userData = {
        name: "Test User",
        email: `test2-${Date.now()}@example.com`,
        password: "password123",
      };

      // First registration should succeed
      await request(app).post("/auth/register").send(userData).expect(200);

      // Second registration should fail
      await request(app).post("/auth/register").send(userData).expect(400);
    });

    it("should login with valid credentials", async () => {
      const userData = {
        name: "Test User",
        email: `test3-${Date.now()}@example.com`,
        password: "password123",
      };

      // Register user first
      await request(app).post("/auth/register").send(userData);

      // Login
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("access_token");
    });

    it("should reject invalid login credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Protected Routes", () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
      // Register and login a user
      const userData = {
        name: "Test User",
        email: `protected-${Date.now()}@example.com`,
        password: "password123",
      };

      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      authToken = registerResponse.body.access_token;
      userId = registerResponse.body.user.id;
    });

    it("should access protected route with valid token", async () => {
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", userId);
    });

    it("should reject access without token", async () => {
      await request(app).get("/auth/me").expect(401);
    });

    it("should reject access with invalid token", async () => {
      await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("Folders", () => {
    let authToken: string;

    beforeAll(async () => {
      const userData = {
        name: "Test User",
        email: `folders-${Date.now()}@example.com`,
        password: "password123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      authToken = response.body.access_token;
    });

    it("should create a new folder", async () => {
      const folderData = {
        name: "Test Folder",
        icon: "📁",
        allow_duplicate: true,
        is_shared: false,
      };

      const response = await request(app)
        .post("/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(folderData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", "Test Folder");
    });

    it("should get all folders", async () => {
      const response = await request(app)
        .get("/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Bookmarks", () => {
    let authToken: string;
    let folderId: string;

    beforeAll(async () => {
      const userData = {
        name: "Test User",
        email: `bookmarks-${Date.now()}@example.com`,
        password: "password123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      authToken = response.body.access_token;

      // Create a folder for bookmarks
      const folderData = {
        name: "Test Folder",
        icon: "📁",
      };

      const folderResponse = await request(app)
        .post("/folders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(folderData);

      folderId = folderResponse.body.id;
    });

    it("should create a new bookmark", async () => {
      const bookmarkData = {
        url: "https://example.com",
        title: "Example Bookmark",
        folder_id: folderId,
        description: "An example bookmark",
        is_pinned: false,
        tags: [{ name: "example", color: "#ff0000" }],
      };

      const response = await request(app)
        .post("/bookmarks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(bookmarkData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("url", "https://example.com");
      expect(response.body).toHaveProperty("title", "Example Bookmark");
    });

    it("should get all bookmarks", async () => {
      const response = await request(app)
        .get("/bookmarks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
