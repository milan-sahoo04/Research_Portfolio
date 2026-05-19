/* eslint-disable no-unused-vars */
// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/userRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import multer from "multer";
import { param, body } from "express-validator";
import {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateUser,
  updateMyProfile,
  deleteUser,
  restoreUser,
  toggleUserStatus,
  uploadProfilePic,
  deleteProfilePic,
  getUserStats,
  bulkDeleteUsers,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly, selfOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — in-memory storage for profile pics
// File is available as req.file.buffer
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF."), false);
    }
  },
});

// ─────────────────────────────────────────────
// VALIDATION CHAINS
// ─────────────────────────────────────────────
const uuidParam = [param("id").isUUID().withMessage("Invalid user ID format.")];

const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Name must be under 100 characters."),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be 'admin' or 'user'."),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must be under 500 characters."),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number."),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be true or false."),

  body("is_super_admin")
    .optional()
    .isBoolean()
    .withMessage("is_super_admin must be true or false."),
];

const updateSelfValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Name must be under 100 characters."),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must be under 500 characters."),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number."),
];

const bulkDeleteValidation = [
  body("ids")
    .isArray({ min: 1, max: 50 })
    .withMessage("ids must be an array of 1–50 UUIDs."),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID."),
];

// ─────────────────────────────────────────────
// SELF ROUTES  (any authenticated user)
// All require valid JWT — no admin role needed
// ─────────────────────────────────────────────

// GET  /api/users/me  — get own profile
router.get("/me", protect, getMyProfile);

// PUT  /api/users/me  — update own name, bio, phone
router.put("/me", protect, updateSelfValidation, updateMyProfile);

// POST /api/users/me/profile-pic — upload own profile picture
router.post(
  "/me/profile-pic",
  protect,
  upload.single("profile_pic"),
  uploadProfilePic,
);

// DELETE /api/users/me/profile-pic — remove own profile picture
router.delete("/me/profile-pic", protect, deleteProfilePic);

// ─────────────────────────────────────────────
// ADMIN ROUTES  (protect + adminOnly on all)
// ─────────────────────────────────────────────

// GET /api/users/admin/stats  — dashboard counts
// MUST be defined before /admin/:id to avoid "stats" being treated as a UUID
router.get("/admin/stats", protect, adminOnly, getUserStats);

// GET /api/users/admin  — list all users with filters + pagination
router.get("/admin", protect, adminOnly, getAllUsers);

// GET /api/users/admin/:id  — get single user
router.get("/admin/:id", protect, adminOnly, uuidParam, getUserById);

// PUT /api/users/admin/:id  — update any user field
router.put(
  "/admin/:id",
  protect,
  adminOnly,
  uuidParam,
  updateUserValidation,
  updateUser,
);

// DELETE /api/users/admin/bulk  — soft delete multiple users
// MUST be before /admin/:id
router.delete(
  "/admin/bulk",
  protect,
  adminOnly,
  bulkDeleteValidation,
  bulkDeleteUsers,
);

// DELETE /api/users/admin/:id  — soft delete single user
router.delete("/admin/:id", protect, adminOnly, uuidParam, deleteUser);

// PUT /api/users/admin/:id/restore  — restore a soft-deleted user
router.put("/admin/:id/restore", protect, adminOnly, uuidParam, restoreUser);

// PUT /api/users/admin/:id/toggle-status  — activate / deactivate
router.put(
  "/admin/:id/toggle-status",
  protect,
  adminOnly,
  uuidParam,
  toggleUserStatus,
);

// POST /api/users/admin/:id/profile-pic  — admin uploads pic for any user
router.post(
  "/admin/:id/profile-pic",
  protect,
  adminOnly,
  uuidParam,
  upload.single("profile_pic"),
  uploadProfilePic,
);

// DELETE /api/users/admin/:id/profile-pic  — admin removes pic for any user
router.delete(
  "/admin/:id/profile-pic",
  protect,
  adminOnly,
  uuidParam,
  deleteProfilePic,
);

// ─────────────────────────────────────────────
// MULTER ERROR HANDLER
// Catches multer-specific errors (file size, type)
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res
        .status(400)
        .json({ success: false, message: "File too large. Max 5 MB." });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message?.includes("Invalid file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  _next(err);
});

export default router;
