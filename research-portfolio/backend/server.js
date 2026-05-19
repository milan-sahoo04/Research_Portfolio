/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/server.js
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import { checkSupabaseConnection } from "./config/supabaseClient.js";
import { socketHandler } from "./socket/socketHandler.js";

// ─────────────────────────────────────────────
// ROUTE IMPORTS
// ─────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectsRoutes.js";
import achievementRoutes from "./routes/achievementsRoutes.js";
import blogRoutes from "./routes/blogsRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
// import publicationRoutes from "./routes/publicationsRoutes.js";

// ─────────────────────────────────────────────
// APP + HTTP SERVER
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app); // ← wrap Express in HTTP server
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

socketHandler(io); // register all socket events

// Make io available to REST controllers if ever needed
app.set("io", io);

// ─────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
  },
});

// ─────────────────────────────────────────────
// BODY + COOKIE PARSERS
// ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// REQUEST LOGGER (dev only)
// ─────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    );
    next();
  });
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Research Portfolio API is running ✅",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    socket: "Socket.IO active ✅",
    routes: {
      auth: "POST /api/auth/signup | login | logout | refresh | forgot-password | reset-password",
      feedback:
        "POST /api/feedback | GET /api/feedback/admin | DELETE /api/feedback/admin/:id",
      users: "/api/users",
      projects: "/api/projects",
      achievements: "/api/achievements",
      blogs: "/api/blogs",
      team: "/api/team",
      chat: "/api/chat",
    },
  });
});

// ─────────────────────────────────────────────
// MOUNTED ROUTES
// ─────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/api/publications", publicationRoutes);

// ─────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message,
  });
});

// ─────────────────────────────────────────────
// START SERVER  ← server.listen, NOT app.listen
// ─────────────────────────────────────────────
async function startServer() {
  try {
    await checkSupabaseConnection();

    server.listen(PORT, () => {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🚀  Server running  → http://localhost:${PORT}`);
      console.log(`🌍  Environment     → ${process.env.NODE_ENV}`);
      console.log(`🔗  Frontend URL    → ${process.env.CLIENT_URL}`);
      console.log(`📋  Health check    → http://localhost:${PORT}/api/health`);
      console.log(`🔌  Socket.IO       → active`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    });
  } catch (err) {
    console.error("[Startup] ❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
