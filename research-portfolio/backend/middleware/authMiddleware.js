/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/middleware/authMiddleware.js
// ─────────────────────────────────────────────────────────────────────────────

import jwt from "jsonwebtoken";
import { supabaseAdmin, TABLES } from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim();
  if (req.headers["x-access-token"])
    return req.headers["x-access-token"].trim();
  return null;
};

const unauthorized = (res, message = "Unauthorized. Please log in.") =>
  res.status(401).json({ success: false, message });

const forbidden = (res, message = "Forbidden. You don't have permission.") =>
  res.status(403).json({ success: false, message });

// ─────────────────────────────────────────────
// 1. protect — verifies JWT, attaches req.user
//    Use on every protected route
// ─────────────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return unauthorized(res, "No token provided. Please log in.");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return unauthorized(res, "Session expired. Please refresh your token.");
      return unauthorized(res, "Invalid token. Please log in again.");
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, role, is_verified, is_active, profile_pic, bio")
      .eq("id", decoded.id)
      .single();

    if (error || !user)
      return unauthorized(res, "User not found. Please log in again.");

    if (user.is_active === false)
      return forbidden(
        res,
        "Your account has been deactivated. Contact support.",
      );

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error("[authMiddleware] protect error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Authentication error." });
  }
};

// ─────────────────────────────────────────────
// 2. optionalProtect — attaches req.user if
//    token present, never blocks guest requests
// ─────────────────────────────────────────────
export const optionalProtect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next();
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
    next();
  }
};

// Add this export alongside protect, optionalProtect, etc.
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admins only." });
  }
  next();
};

// ─────────────────────────────────────────────
// 3. verifyRefreshToken — reads httpOnly cookie,
//    used ONLY by POST /api/auth/refresh
// ─────────────────────────────────────────────
export const verifyRefreshToken = (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return unauthorized(res, "No refresh token. Please log in.");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return unauthorized(res, "Refresh token expired. Please log in again.");
      return unauthorized(res, "Invalid refresh token.");
    }

    req.refreshPayload = decoded;
    req.rawRefreshToken = token;
    next();
  } catch (err) {
    console.error("[authMiddleware] verifyRefreshToken error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Token verification error." });
  }
};

// ─────────────────────────────────────────────
// 4. rateLimitByUser — simple in-memory per-user
//    rate limiter for sensitive endpoints
//    Usage: rateLimitByUser(10, 60) → max 10 req / 60s
// ─────────────────────────────────────────────
const userRequestMap = new Map();

export const rateLimitByUser = (maxRequests = 10, windowSeconds = 60) => {
  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user.id;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    if (!userRequestMap.has(userId)) userRequestMap.set(userId, []);

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

    // Prevent memory leak
    if (userRequestMap.size > 1000) {
      for (const [key, val] of userRequestMap.entries()) {
        if (val.every((ts) => now - ts > windowMs)) userRequestMap.delete(key);
      }
    }
    next();
  };
};
