/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/projectsRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import multer from "multer";
import { body } from "express-validator";

import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getAllProjects,
  getProjectById,
  getProjectMeta,
  createProject,
  updateProject,
  deleteProject,
  bulkDeleteProjects,
  toggleFeatured,
  uploadProjectImage,
  uploadProjectFiles,
  getProjectStats,
  adminGetAllProjects,
} from "../controllers/projectsController.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — memory storage (buffer → Supabase)
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|doc|docx|ppt|pptx|zip/;
    const ext = file.originalname.split(".").pop().toLowerCase();
    allowed.test(ext)
      ? cb(null, true)
      : cb(new Error(`File type .${ext} not allowed`));
  },
});

// fields() for create/update — handles both image & files in one request
const projectUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "files", maxCount: 10 },
]);

// ─────────────────────────────────────────────
// VALIDATORS
// ─────────────────────────────────────────────
const createValidators = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("visibility must be public or private."),
  body("stars")
    .optional()
    .isInt({ min: 0 })
    .withMessage("stars must be a non-negative integer."),
  body("forks")
    .optional()
    .isInt({ min: 0 })
    .withMessage("forks must be a non-negative integer."),
  body("github_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("github_url must be a valid URL."),
  body("demo_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("demo_url must be a valid URL."),
  body("status")
    .optional()
    .isIn(["Completed", "Ongoing"])
    .withMessage("status must be Completed or Ongoing."),
];

const updateValidators = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty."),
  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("visibility must be public or private."),
  body("stars")
    .optional()
    .isInt({ min: 0 })
    .withMessage("stars must be a non-negative integer."),
  body("forks")
    .optional()
    .isInt({ min: 0 })
    .withMessage("forks must be a non-negative integer."),
  body("github_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("github_url must be a valid URL."),
  body("demo_url")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("demo_url must be a valid URL."),
  body("status")
    .optional()
    .isIn(["Completed", "Ongoing"])
    .withMessage("status must be Completed or Ongoing."),
];

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────
router.get("/", getAllProjects); // GET  /api/projects
router.get("/meta", getProjectMeta); // GET  /api/projects/meta
// ⚠️ /:id must stay last — it's a catch-all
router.get("/:id", getProjectById); // GET  /api/projects/:id

// ─────────────────────────────────────────────
// ADMIN ROUTES  (protect + requireAdmin)
// ─────────────────────────────────────────────
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  adminGetAllProjects, // GET  /api/projects/admin/all
);

router.get(
  "/admin/stats",
  protect,
  requireAdmin,
  getProjectStats, // GET  /api/projects/admin/stats
);

router.post(
  "/admin",
  protect,
  requireAdmin,
  projectUpload,
  createValidators,
  createProject, // POST /api/projects/admin
);

router.put(
  "/admin/:id",
  protect,
  requireAdmin,
  projectUpload,
  updateValidators,
  updateProject, // PUT  /api/projects/admin/:id
);

router.delete(
  "/admin/bulk",
  protect,
  requireAdmin,
  bulkDeleteProjects, // DELETE /api/projects/admin/bulk
);

router.delete(
  "/admin/:id",
  protect,
  requireAdmin,
  deleteProject, // DELETE /api/projects/admin/:id
);

router.patch(
  "/admin/:id/featured",
  protect,
  requireAdmin,
  toggleFeatured, // PATCH /api/projects/admin/:id/featured
);

router.post(
  "/admin/:id/image",
  protect,
  requireAdmin,
  upload.single("image"),
  uploadProjectImage, // POST /api/projects/admin/:id/image
);

router.post(
  "/admin/:id/files",
  protect,
  requireAdmin,
  upload.array("files", 10),
  uploadProjectFiles, // POST /api/projects/admin/:id/files
);

export default router;
