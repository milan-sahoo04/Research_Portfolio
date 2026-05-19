// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/achievementsRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import multer from "multer";
import { body, param } from "express-validator";
import {
  getAllAchievements,
  getAchievementById,
  getAchievementMeta,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  bulkDeleteAchievements,
  uploadAchievementImage,
  uploadAchievementPDF,
  getAchievementStats,
  adminGetAllAchievements,
} from "../controllers/achievementsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — memory storage (no temp files on disk)
// ─────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image type. Allowed: JPG, PNG, WebP, GIF."), false);
    }
  },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF allowed."), false);
    }
  },
});

// Combined upload for create/update (both pdf + image in one request)
const combinedUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."), false);
    }
  },
});

// ─────────────────────────────────────────────
// VALIDATION CHAINS
// ─────────────────────────────────────────────
const uuidParam = [param("id").isUUID().withMessage("Invalid achievement ID.")];

const createValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ max: 200 })
    .withMessage("Title must be under 200 characters."),

  body("description")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters."),

  body("type")
    .optional()
    .isIn([
      "Award",
      "Patent",
      "Fellowship",
      "Grant",
      "Certification",
      "Recognition",
      "Other",
    ])
    .withMessage("Invalid type."),

  body("status")
    .optional()
    .isIn(["Active", "Pending", "Expired", "Granted", "Completed", "Published"])
    .withMessage("Invalid status."),

  body("date")
    .optional()
    .isDate()
    .withMessage("date must be a valid date (YYYY-MM-DD)."),

  body("year")
    .optional()
    .matches(/^\d{4}$/)
    .withMessage("Year must be a 4-digit number."),

  body("url").optional().isURL().withMessage("url must be a valid URL."),

  body("tags").optional(),
];

const updateValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty.")
    .isLength({ max: 200 })
    .withMessage("Title must be under 200 characters."),

  body("description")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters."),

  body("type")
    .optional()
    .isIn([
      "Award",
      "Patent",
      "Fellowship",
      "Grant",
      "Certification",
      "Recognition",
      "Other",
    ])
    .withMessage("Invalid type."),

  body("status")
    .optional()
    .isIn(["Active", "Pending", "Expired", "Granted", "Completed", "Published"])
    .withMessage("Invalid status."),

  body("date")
    .optional()
    .isDate()
    .withMessage("date must be a valid date (YYYY-MM-DD)."),

  body("year")
    .optional()
    .customSanitizer((val) => (typeof val === "string" ? val.trim() : val))
    .matches(/^\d{4}$/)
    .withMessage("Year must be a 4-digit number."),

  body("url").optional().isURL().withMessage("url must be a valid URL."),
];

const bulkDeleteValidation = [
  body("ids")
    .isArray({ min: 1, max: 50 })
    .withMessage("ids must be a non-empty array (max 50)."),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID."),
];

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// GET /api/achievements/meta  — distinct types, statuses, years, tags for filter UI
// ⚠️  Must be before /:id to avoid "meta" being treated as a UUID
router.get("/meta", getAchievementMeta);

// GET /api/achievements  — paginated list with search + filters
// Query: page, limit, search, type, status, year, tag, sort, order
router.get("/", getAllAchievements);

// GET /api/achievements/:id  — single achievement (public)
router.get("/:id", uuidParam, getAchievementById);

// ─────────────────────────────────────────────
// ADMIN ROUTES  (protect + adminOnly on all)
// ─────────────────────────────────────────────

// GET /api/achievements/admin/stats  — dashboard counts by type and status
// ⚠️  Must be before /admin/:id
router.get("/admin/stats", protect, adminOnly, getAchievementStats);

// GET /api/achievements/admin/all  — full list for manage table (all columns)
// Query: page, limit, search, type, status, year
router.get("/admin/all", protect, adminOnly, adminGetAllAchievements);

// POST /api/achievements/admin  — create achievement
// Accepts: multipart/form-data (pdf field + image field) OR application/json
router.post(
  "/admin",
  protect,
  adminOnly,
  combinedUpload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  createValidation,
  createAchievement,
);

// PUT /api/achievements/admin/:id  — update achievement
router.put(
  "/admin/:id",
  protect,
  adminOnly,
  uuidParam,
  combinedUpload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateValidation,
  updateAchievement,
);

// DELETE /api/achievements/admin/bulk  — bulk delete
// ⚠️  Must be before /admin/:id
router.delete(
  "/admin/bulk",
  protect,
  adminOnly,
  bulkDeleteValidation,
  bulkDeleteAchievements,
);

// DELETE /api/achievements/admin/:id  — delete single achievement
router.delete("/admin/:id", protect, adminOnly, uuidParam, deleteAchievement);

// POST /api/achievements/admin/:id/image  — upload / replace image only
router.post(
  "/admin/:id/image",
  protect,
  adminOnly,
  uuidParam,
  imageUpload.single("image"),
  uploadAchievementImage,
);

// POST /api/achievements/admin/:id/pdf  — upload / replace PDF only
router.post(
  "/admin/:id/pdf",
  protect,
  adminOnly,
  uuidParam,
  pdfUpload.single("pdf"),
  uploadAchievementPDF,
);

// ─────────────────────────────────────────────
// MULTER ERROR HANDLER
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({
        success: false,
        message: "File too large. Max 10 MB for PDF, 5 MB for images.",
      });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  _next(err);
});

export default router;
