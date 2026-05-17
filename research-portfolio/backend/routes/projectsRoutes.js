const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const multer = require("multer");

const projectsController = require("../controllers/projectsController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const {
  adminOnly,
  checkMinRole,
  ownerOrAdmin,
} = require("../middleware/roleMiddleware");
const { supabaseAdmin, TABLES } = require("../config/supabaseClient");

// ─── Multer — memory storage (files go to Supabase Storage, not disk) ────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."), false);
    }
  },
});

// ─── Reusable validators ──────────────────────────────────────────────────────
const projectIdParam = param("id")
  .isUUID()
  .withMessage("Invalid project ID format.");

const createProjectValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be 3–200 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters."),

  body("short_description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Short description cannot exceed 300 characters."),

  body("category")
    .notEmpty()
    .withMessage("Category is required.")
    .isIn(["AI", "Healthcare", "Environmental", "Full Stack", "Other"])
    .withMessage(
      "Category must be: AI, Healthcare, Environmental, Full Stack, or Other.",
    ),

  body("tech_stack").optional(),

  body("github_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("GitHub URL must be a valid URL."),

  body("demo_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Demo URL must be a valid URL."),

  body("paper_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Paper URL must be a valid URL."),

  body("status")
    .optional()
    .isIn(["ongoing", "completed", "published", "paused"])
    .withMessage("Status must be: ongoing, completed, published, or paused."),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Visibility must be 'public' or 'private'."),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false."),

  body("start_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Start date must be a valid date (YYYY-MM-DD)."),

  body("end_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("End date must be a valid date (YYYY-MM-DD).")
    .custom((val, { req }) => {
      if (
        val &&
        req.body.start_date &&
        new Date(val) < new Date(req.body.start_date)
      ) {
        throw new Error("End date cannot be before start date.");
      }
      return true;
    }),
];

const updateProjectValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be 3–200 characters."),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description cannot exceed 5000 characters."),

  body("short_description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Short description cannot exceed 300 characters."),

  body("category")
    .optional()
    .isIn(["AI", "Healthcare", "Environmental", "Full Stack", "Other"])
    .withMessage("Invalid category."),

  body("github_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Invalid GitHub URL."),

  body("demo_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Invalid demo URL."),

  body("paper_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Invalid paper URL."),

  body("status")
    .optional()
    .isIn(["ongoing", "completed", "published", "paused"])
    .withMessage("Invalid status."),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Visibility must be 'public' or 'private'."),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false."),

  body("start_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid start date."),

  body("end_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid end date.")
    .custom((val, { req }) => {
      if (
        val &&
        req.body.start_date &&
        new Date(val) < new Date(req.body.start_date)
      ) {
        throw new Error("End date cannot be before start date.");
      }
      return true;
    }),
];

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50."),
];

// ─── Multer error handler wrapper ─────────────────────────────────────────────
const handleUpload = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "File too large. Maximum size is 10MB."
            : `Upload error: ${err.message}`,
      });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ─── Owner fetch helper for ownerOrAdmin middleware ───────────────────────────
const fetchProjectOwner = async (projectId) => {
  const { data } = await supabaseAdmin
    .from(TABLES.PROJECTS)
    .select("owner_id")
    .eq("id", projectId)
    .single();
  return data ? { owner_id: data.owner_id } : null;
};

// =============================================================================
// ROUTES
// =============================================================================

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /api/projects/featured — featured projects for homepage
router.get("/featured", projectsController.getFeaturedProjects);

// GET /api/projects/meta — categories, statuses, tech stacks for filter UI
router.get("/meta", projectsController.getProjectMeta);

// GET /api/projects — list all public projects with search/filter/pagination
router.get(
  "/",
  paginationValidation,
  optionalProtect,
  projectsController.getProjects,
);

// GET /api/projects/:id — single project detail
router.get(
  "/:id",
  projectIdParam,
  optionalProtect,
  projectsController.getProjectById,
);

// ── Private routes (must be logged in) ───────────────────────────────────────

// GET /api/projects/my — current user's own projects
router.get(
  "/user/my",
  protect,
  paginationValidation,
  projectsController.getMyProjects,
);

// POST /api/projects — create new project (with optional image)
router.post(
  "/",
  protect,
  handleUpload("image"),
  createProjectValidation,
  projectsController.createProject,
);

// PUT /api/projects/:id — update project (owner or admin)
router.put(
  "/:id",
  protect,
  handleUpload("image"),
  projectIdParam,
  updateProjectValidation,
  projectsController.updateProject,
);

// PATCH /api/projects/:id/visibility — toggle public/private (owner or admin)
router.patch(
  "/:id/visibility",
  protect,
  projectIdParam,
  ownerOrAdmin(fetchProjectOwner),
  projectsController.toggleVisibility,
);

// POST /api/projects/:id/image — upload/replace project image
router.post(
  "/:id/image",
  protect,
  handleUpload("image"),
  projectIdParam,
  projectsController.uploadProjectImage,
);

// DELETE /api/projects/:id — delete project (owner or admin)
router.delete(
  "/:id",
  protect,
  projectIdParam,
  projectsController.deleteProject,
);

// ── Admin-only routes ─────────────────────────────────────────────────────────

// GET /api/projects/admin/all — all projects regardless of visibility
router.get(
  "/admin/all",
  protect,
  adminOnly,
  paginationValidation,
  projectsController.adminGetAllProjects,
);

// GET /api/projects/admin/stats — project statistics for dashboard
router.get(
  "/admin/stats",
  protect,
  adminOnly,
  projectsController.getProjectStats,
);

// PATCH /api/projects/:id/featured — toggle featured flag
router.patch(
  "/:id/featured",
  protect,
  adminOnly,
  projectIdParam,
  projectsController.toggleFeatured,
);

module.exports = router;
