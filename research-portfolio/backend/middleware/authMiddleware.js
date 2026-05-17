const jwt = require("jsonwebtoken");
const { supabase, supabaseAdmin, TABLES } = require("../config/supabaseClient");

// ─── Helper: extract Bearer token from header ─────────────────────────────────
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  // Also check x-access-token header as fallback
  if (req.headers["x-access-token"]) {
    return req.headers["x-access-token"].trim();
  }
  return null;
};

// ─── Helper: standard error response ─────────────────────────────────────────
const unauthorized = (res, message = "Unauthorized. Please log in.") => {
  return res.status(401).json({ success: false, message });
};

const forbidden = (res, message = "Forbidden. You don't have permission.") => {
  return res.status(403).json({ success: false, message });
};

// ─── 1. protect ───────────────────────────────────────────────────────────────
// Verifies the access JWT. Attaches req.user for downstream handlers.
// Usage: router.get("/profile", protect, handler)
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return unauthorized(res, "No token provided. Please log in.");
    }

    // Verify token signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return unauthorized(res, "Session expired. Please refresh your token.");
      }
      if (err.name === "JsonWebTokenError") {
        return unauthorized(res, "Invalid token. Please log in again.");
      }
      return unauthorized(res, "Token verification failed.");
    }

    // Fetch fresh user from DB so we always have latest role/status
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, role, is_verified, is_active, profile_pic, bio")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return unauthorized(res, "User not found. Please log in again.");
    }

    // Block deactivated accounts
    if (user.is_active === false) {
      return forbidden(
        res,
        "Your account has been deactivated. Contact support.",
      );
    }

    // Attach user + raw token to request
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    console.error("protect middleware error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Authentication error." });
  }
};

// ─── 2. optionalProtect ───────────────────────────────────────────────────────
// Same as protect but doesn't block if no token — just skips attaching req.user.
// Use for routes that have different responses for auth vs guest users.
// Usage: router.get("/publications", optionalProtect, handler)
const optionalProtect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next(); // guest — continue without user

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(); // invalid/expired token — treat as guest
    }

    const { data: user } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, role, is_verified, is_active, profile_pic")
      .eq("id", decoded.id)
      .single();

    if (user && user.is_active !== false) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch {
    next(); // never block on optional auth
  }
};

// ─── 3. requireRole ──────────────────────────────────────────────────────────
// Role-based access guard. Must be used AFTER protect.
// Accepts one or more roles as arguments.
// Usage: router.delete("/users/:id", protect, requireRole("admin"), handler)
// Usage: router.post("/publish", protect, requireRole("admin", "editor"), handler)
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, "Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(
        res,
        `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}.`,
      );
    }

    next();
  };
};

// ─── 4. requireAdmin ─────────────────────────────────────────────────────────
// Shorthand for requireRole("admin"). Must be used AFTER protect.
// Usage: router.get("/admin/feedback", protect, requireAdmin, handler)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorized(res, "Authentication required.");
  }

  if (req.user.role !== "admin") {
    return forbidden(res, "Admin access required.");
  }

  next();
};

// ─── 5. requireVerified ──────────────────────────────────────────────────────
// Blocks unverified users. Must be used AFTER protect.
// Usage: router.post("/projects", protect, requireVerified, handler)
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return unauthorized(res, "Authentication required.");
  }

  if (req.user.is_verified === false) {
    return res.status(403).json({
      success: false,
      message:
        "Email not verified. Please check your inbox and verify your email address.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

// ─── 6. requireOwnerOrAdmin ───────────────────────────────────────────────────
// Checks that the authenticated user owns the resource OR is an admin.
// Assumes the resource owner ID is in req.resource.ownerId (set by a prior middleware or fetched in the handler).
// Alternatively, pass a function that returns the owner ID from the request.
//
// Usage example in a route handler (manually):
//   const project = await fetchProject(req.params.id);
//   if (project.owner_id !== req.user.id && req.user.role !== "admin") return forbidden(res);
//
// Or as middleware when owner field is known:
//   router.delete("/:id", protect, requireOwnerOrAdmin("owner_id", fetchProject), handler)
const requireOwnerOrAdmin = (ownerField, fetchFn) => {
  return async (req, res, next) => {
    if (!req.user) return unauthorized(res);

    // Admins always pass
    if (req.user.role === "admin") return next();

    try {
      const resource = await fetchFn(req.params.id);
      if (!resource) {
        return res
          .status(404)
          .json({ success: false, message: "Resource not found." });
      }

      if (resource[ownerField] !== req.user.id) {
        return forbidden(res, "You can only modify your own resources.");
      }

      req.resource = resource; // attach for downstream use
      next();
    } catch (err) {
      console.error("requireOwnerOrAdmin error:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Authorization check failed." });
    }
  };
};

// ─── 7. verifyRefreshToken ───────────────────────────────────────────────────
// Used exclusively by POST /api/auth/refresh.
// Reads the refresh token from the httpOnly cookie, verifies it,
// and attaches the decoded payload to req.refreshPayload.
const verifyRefreshToken = (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return unauthorized(res, "No refresh token. Please log in.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return unauthorized(res, "Refresh token expired. Please log in again.");
      }
      return unauthorized(res, "Invalid refresh token.");
    }

    req.refreshPayload = decoded;
    req.rawRefreshToken = token;
    next();
  } catch (err) {
    console.error("verifyRefreshToken error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Token verification error." });
  }
};

// ─── 8. rateLimitByUser ──────────────────────────────────────────────────────
// Simple in-memory per-user rate limiter for sensitive endpoints.
// For production, replace with Redis-backed rate limiter.
// Usage: router.post("/upload", protect, rateLimitByUser(10, 60), handler)
//   → max 10 requests per user per 60 seconds
const userRequestMap = new Map();

const rateLimitByUser = (maxRequests = 10, windowSeconds = 60) => {
  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user.id;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    if (!userRequestMap.has(userId)) {
      userRequestMap.set(userId, []);
    }

    // Remove timestamps outside the window
    const timestamps = userRequestMap
      .get(userId)
      .filter((ts) => now - ts < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Max ${maxRequests} per ${windowSeconds}s.`,
        retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000),
      });
    }

    timestamps.push(now);
    userRequestMap.set(userId, timestamps);

    // Cleanup old entries every 1000 entries to prevent memory leak
    if (userRequestMap.size > 1000) {
      for (const [key, val] of userRequestMap.entries()) {
        if (val.every((ts) => now - ts > windowMs)) {
          userRequestMap.delete(key);
        }
      }
    }

    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  requireRole,
  requireAdmin,
  requireVerified,
  requireOwnerOrAdmin,
  verifyRefreshToken,
  rateLimitByUser,
};
