const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { body, param, query } = require("express-validator");
const authController = require("../controllers/authController");
const { protect, verifyRefreshToken } = require("../middleware/authMiddleware");
const { checkMinRole } = require("../middleware/roleMiddleware");

// ─── Route-specific rate limiters ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many accounts created. Try again in 1 hour.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: "Too many reset requests. Try again in 1 hour.",
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many refresh attempts." },
});

// ─── Validators ───────────────────────────────────────────────────────────────
const signupValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be 2–80 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character."),
  body("role")
    .optional()
    .isIn(["user", "researcher"])
    .withMessage("Role must be 'user' or 'researcher'."),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required."),
  body("password")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Must contain an uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Must contain a number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Must contain a special character."),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required."),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required.")
    .isLength({ min: 8 })
    .withMessage("Must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Must contain an uppercase letter.")
    .matches(/[0-9]/)
    .withMessage("Must contain a number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Must contain a special character.")
    .custom((val, { req }) => {
      if (val === req.body.currentPassword) {
        throw new Error(
          "New password must be different from current password.",
        );
      }
      return true;
    }),
];

const verifyEmailValidation = [
  query("token").notEmpty().withMessage("Verification token is required."),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", signupLimiter, signupValidation, authController.signup);

// @route   POST /api/auth/login
// @desc    Login with email + password → returns access token + sets refresh cookie
// @access  Public
router.post("/login", loginLimiter, loginValidation, authController.login);

// @route   POST /api/auth/logout
// @desc    Invalidate refresh token and clear cookie
// @access  Private
router.post("/logout", protect, authController.logout);

// @route   GET /api/auth/me
// @desc    Get current authenticated user profile
// @access  Private
router.get("/me", protect, authController.getMe);

// @route   POST /api/auth/refresh
// @desc    Issue new access + refresh token pair (rotation)
// @access  Public (uses httpOnly refresh cookie)
router.post(
  "/refresh",
  refreshLimiter,
  verifyRefreshToken,
  authController.refreshToken,
);

// @route   GET /api/auth/verify-email?token=xxx
// @desc    Verify user's email address via token
// @access  Public
router.get("/verify-email", verifyEmailValidation, authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email to current user
// @access  Private
router.post(
  "/resend-verification",
  protect,
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: {
      success: false,
      message: "Too many resend requests. Wait 10 minutes.",
    },
  }),
  authController.resendVerificationEmail,
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPasswordValidation,
  authController.forgotPassword,
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token from email
// @access  Public
router.post(
  "/reset-password",
  forgotPasswordLimiter,
  resetPasswordValidation,
  authController.resetPassword,
);

// @route   PUT /api/auth/change-password
// @desc    Change password when already logged in
// @access  Private
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  authController.changePassword,
);

// @route   GET /api/auth/check
// @desc    Quick token validity check (no DB hit — just JWT verify)
// @access  Private
router.get("/check", protect, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid.",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      is_verified: req.user.is_verified,
    },
  });
});

// @route   DELETE /api/auth/delete-account
// @desc    Permanently delete current user's account
// @access  Private (admin can delete any; user deletes own)
router.delete(
  "/delete-account",
  protect,
  body("password").notEmpty().withMessage("Password confirmation required."),
  authController.deleteAccount,
);

// @route   GET /api/auth/sessions
// @desc    List all active sessions for current user
// @access  Private
router.get("/sessions", protect, authController.getSessions);

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Revoke a specific session
// @access  Private
router.delete(
  "/sessions/:sessionId",
  protect,
  param("sessionId").isUUID().withMessage("Invalid session ID."),
  authController.revokeSession,
);

// @route   DELETE /api/auth/sessions
// @desc    Revoke ALL sessions for current user (force re-login everywhere)
// @access  Private
router.delete("/sessions", protect, authController.revokeAllSessions);

// ─── Admin-only auth management ───────────────────────────────────────────────

// @route   PUT /api/auth/admin/role/:userId
// @desc    Change a user's role (admin only)
// @access  Private + Admin
router.put(
  "/admin/role/:userId",
  protect,
  checkMinRole("admin"),
  [
    param("userId").isUUID().withMessage("Invalid user ID."),
    body("role")
      .notEmpty()
      .withMessage("Role is required.")
      .isIn(["user", "researcher", "editor", "moderator", "admin"])
      .withMessage("Invalid role."),
  ],
  authController.updateUserRole,
);

// @route   PUT /api/auth/admin/activate/:userId
// @desc    Activate or deactivate a user account
// @access  Private + Admin
router.put(
  "/admin/activate/:userId",
  protect,
  checkMinRole("admin"),
  [
    param("userId").isUUID().withMessage("Invalid user ID."),
    body("is_active").isBoolean().withMessage("is_active must be boolean."),
  ],
  authController.toggleUserActive,
);

module.exports = router;
