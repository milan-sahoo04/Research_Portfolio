/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/teamRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import multer from "multer";
import { body } from "express-validator";

import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getAllMembers,
  getMemberById,
  getTeamMeta,
  createMember,
  updateMember,
  deleteMember,
  bulkDeleteMembers,
  toggleFeatured,
  uploadProfilePic,
  getTeamStats,
  adminGetAllMembers,
} from "../controllers/teamController.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — images only, 5 MB max
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = file.originalname.split(".").pop().toLowerCase();
    allowed.test(ext)
      ? cb(null, true)
      : cb(new Error(`File type .${ext} not allowed. Use jpeg/jpg/png/webp.`));
  },
});

// ─────────────────────────────────────────────
// VALIDATORS
// ─────────────────────────────────────────────
const createValidators = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("role")
    .optional()
    .isIn(["Researcher", "Faculty", "Student"])
    .withMessage("role must be Researcher, Faculty, or Student."),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Must be a valid email address."),
  body("publications")
    .optional()
    .isInt({ min: 0 })
    .withMessage("publications must be a non-negative integer."),
  body("citations")
    .optional()
    .isInt({ min: 0 })
    .withMessage("citations must be a non-negative integer."),
];

const updateValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty."),
  body("role")
    .optional()
    .isIn(["Researcher", "Faculty", "Student"])
    .withMessage("role must be Researcher, Faculty, or Student."),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Must be a valid email address."),
  body("publications")
    .optional()
    .isInt({ min: 0 })
    .withMessage("publications must be a non-negative integer."),
  body("citations")
    .optional()
    .isInt({ min: 0 })
    .withMessage("citations must be a non-negative integer."),
];

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────
router.get("/", getAllMembers); // GET /api/team
router.get("/meta", getTeamMeta); // GET /api/team/meta
// ⚠️ /:id must stay last — it's a catch-all
router.get("/:id", getMemberById); // GET /api/team/:id

// ─────────────────────────────────────────────
// ADMIN ROUTES  (protect + requireAdmin)
// ─────────────────────────────────────────────
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  adminGetAllMembers, // GET  /api/team/admin/all
);

router.get(
  "/admin/stats",
  protect,
  requireAdmin,
  getTeamStats, // GET  /api/team/admin/stats
);

router.post(
  "/admin",
  protect,
  requireAdmin,
  upload.single("profile_pic"),
  createValidators,
  createMember, // POST /api/team/admin
);

router.put(
  "/admin/:id",
  protect,
  requireAdmin,
  upload.single("profile_pic"),
  updateValidators,
  updateMember, // PUT  /api/team/admin/:id
);

router.delete(
  "/admin/bulk",
  protect,
  requireAdmin,
  bulkDeleteMembers, // DELETE /api/team/admin/bulk
);

router.delete(
  "/admin/:id",
  protect,
  requireAdmin,
  deleteMember, // DELETE /api/team/admin/:id
);

router.patch(
  "/admin/:id/featured",
  protect,
  requireAdmin,
  toggleFeatured, // PATCH /api/team/admin/:id/featured
);

router.post(
  "/admin/:id/profile-pic",
  protect,
  requireAdmin,
  upload.single("profile_pic"),
  uploadProfilePic, // POST /api/team/admin/:id/profile-pic
);

export default router;
