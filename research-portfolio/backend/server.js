const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// ─── Internal imports ─────────────────────────────────────────────────────────
const { checkSupabaseConnection } = require("./config/supabaseClient");
const { verifyEmailConnection } = require("./utils/email");
const errorMiddleware = require("./middleware/errorMiddleware");

// ─── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const publicationRoutes = require("./routes/publicationsRoutes");
const projectRoutes = require("./routes/projectsRoutes");
const achievementRoutes = require("./routes/achievementsRoutes");
const teamRoutes = require("./routes/teamRoutes");
const blogRoutes = require("./routes/blogsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// ─── App init ─────────────────────────────────────────────────────────────────
const app = express();

// ─── Trust proxy (needed for rate limiting behind Render/Nginx/Vercel) ────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", process.env.SUPABASE_URL],
      },
    },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Total-Pages"],
  }),
);

// ─── Body parsing + cookies ───────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP request logger ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // Compact production format
  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
      skip: (req) => req.url === "/api/health",
    }),
  );
}

// ─── Static file serving (uploaded PDFs, images) ─────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Global rate limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  skip: (req) => req.url === "/api/health",
});
app.use("/api", globalLimiter);

// ─── Stricter limiter for contact form ────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many contact form submissions. Try again in 1 hour.",
  },
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/contact", contactLimiter, contactRoutes);
app.use("/api/upload", uploadRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// ─── API info ─────────────────────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Research Portfolio API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      publications: "/api/publications",
      projects: "/api/projects",
      achievements: "/api/achievements",
      team: "/api/team",
      blog: "/api/blog",
      contact: "/api/contact",
      upload: "/api/upload",
      health: "/api/health",
    },
  });
});

// ─── 404 handler (catch-all for unknown routes) ────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Startup sequence ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  // 1. Check Supabase connectivity
  const supabaseOk = await checkSupabaseConnection();
  if (!supabaseOk) {
    console.error(
      "❌ Cannot connect to Supabase. Check SUPABASE_URL and keys in .env",
    );
    process.exit(1);
  }

  // 2. Verify SMTP (non-fatal — server starts even if email fails)
  await verifyEmailConnection();

  // 3. Start listening
  const server = app.listen(PORT, () => {
    console.log("");
    console.log("┌────────────────────────────────────────────┐");
    console.log("│      🎓 Research Portfolio API              │");
    console.log("├────────────────────────────────────────────┤");
    console.log(`│  Port        : ${PORT}                          │`);
    console.log(
      `│  Environment : ${(process.env.NODE_ENV || "development").padEnd(29)}│`,
    );
    console.log(
      `│  Client URL  : ${(process.env.CLIENT_URL || "http://localhost:5173").padEnd(29)}│`,
    );
    console.log(`│  Health      : http://localhost:${PORT}/api/health  │`);
    console.log("└────────────────────────────────────────────┘");
    console.log("");
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error("⚠️  Forced exit after 10s timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // ─── Unhandled errors ──────────────────────────────────────────────────────
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🔴 Unhandled Rejection at:", promise, "reason:", reason);
    if (process.env.NODE_ENV === "production") {
      gracefulShutdown("unhandledRejection");
    }
  });

  process.on("uncaughtException", (err) => {
    console.error("🔴 Uncaught Exception:", err.message);
    gracefulShutdown("uncaughtException");
  });

  return server;
};

startServer();

module.exports = app;
