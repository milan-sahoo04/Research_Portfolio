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
  hardDeleteUser,
  restoreUser,
  toggleUserStatus,
  uploadProfilePic,
  deleteProfilePic,
  getUserStats,
  bulkDeleteUsers,
  getAdminsForChat,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly, selfOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — in-memory storage for profile pics
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
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
// ─────────────────────────────────────────────
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateSelfValidation, updateMyProfile);
router.post(
  "/me/profile-pic",
  protect,
  upload.single("profile_pic"),
  uploadProfilePic,
);
router.delete("/me/profile-pic", protect, deleteProfilePic);
router.get("/admins", protect, getAdminsForChat);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

// Stats — must be before /admin/:id
router.get("/admin/stats", protect, adminOnly, getUserStats);

// List / get
router.get("/admin", protect, adminOnly, getAllUsers);
router.get("/admin/:id", protect, adminOnly, uuidParam, getUserById);

// Update
router.put(
  "/admin/:id",
  protect,
  adminOnly,
  uuidParam,
  updateUserValidation,
  updateUser,
);

// Bulk soft-delete — must be before /admin/:id
router.delete(
  "/admin/bulk",
  protect,
  adminOnly,
  bulkDeleteValidation,
  bulkDeleteUsers,
);

// Soft delete (sets deleted_at, recoverable via restore)
router.delete("/admin/:id", protect, adminOnly, uuidParam, deleteUser);

// ── Hard (permanent) delete ── NEW
// DELETE /api/users/admin/:id/permanent
router.delete(
  "/admin/:id/permanent",
  protect,
  adminOnly,
  uuidParam,
  hardDeleteUser,
);

// Restore soft-deleted user
router.put("/admin/:id/restore", protect, adminOnly, uuidParam, restoreUser);

// Toggle active/inactive
router.put(
  "/admin/:id/toggle-status",
  protect,
  adminOnly,
  uuidParam,
  toggleUserStatus,
);

// Profile pics
router.post(
  "/admin/:id/profile-pic",
  protect,
  adminOnly,
  uuidParam,
  upload.single("profile_pic"),
  uploadProfilePic,
);
router.delete(
  "/admin/:id/profile-pic",
  protect,
  adminOnly,
  uuidParam,
  deleteProfilePic,
);

// ─────────────────────────────────────────────
// MULTER ERROR HANDLER
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
