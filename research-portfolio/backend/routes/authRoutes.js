// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/authRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  signup,
  login,
  logout,
  getMe,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  googleAuth,
  googleCallback,
  getAdminInfo,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireVerified } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES  (no token required)
// ─────────────────────────────────────────────
// GET  /api/auth/google
router.get("/google", googleAuth);

// GET  /api/auth/google/callback
router.get("/google/callback", googleCallback);

// GET  /api/auth/admin/info
router.get("/admin/info", getAdminInfo);
// POST /api/auth/signup
// Body: { name, email, password, role? }
router.post("/signup", signup);

// POST /api/auth/login
// Body: { email, password }
router.post("/login", login);

// GET  /api/auth/verify-email?token=<token>
router.get("/verify-email", verifyEmail);

// POST /api/auth/forgot-password
// Body: { email }
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
// Body: { token, newPassword, confirmPassword }
router.post("/reset-password", resetPassword);

// POST /api/auth/refresh
// Cookie: refreshToken (httpOnly)
router.post("/refresh", refreshToken);

// ─────────────────────────────────────────────
// PROTECTED ROUTES  (valid JWT required)
// ─────────────────────────────────────────────

// GET  /api/auth/me
router.get("/me", protect, getMe);

// POST /api/auth/logout
router.post("/logout", protect, logout);

// PUT  /api/auth/change-password
// Body: { currentPassword, newPassword, confirmPassword }
router.put("/change-password", protect, requireVerified, changePassword);

export default router;
