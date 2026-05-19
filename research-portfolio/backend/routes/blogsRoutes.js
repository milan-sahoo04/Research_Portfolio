// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/blogsRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
import multer from "multer";
import express from "express";
import {
  // Public
  getAllBlogs,
  getBlogById,
  getFeaturedBlogs,
  getAllTags,
  // Admin — read
  getBlogStats,
  getAllBlogsAdmin,
  // Admin — write
  createBlog,
  updateBlog,
  deleteBlog,
  bulkDeleteBlogs,
  toggleFeatured,
  // Admin — image
  uploadBlogImage,
  deleteBlogImage,
} from "../controllers/blogsController.js";

import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { requireVerified, adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// Multer setup for image uploads
// ─────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─────────────────────────────────────────────
// ADMIN ROUTES — must come BEFORE /:id to avoid conflicts
// All require: protect → requireVerified → adminOnly
// ─────────────────────────────────────────────

// GET /api/blogs/admin/stats
router.get("/admin/stats", protect, requireVerified, adminOnly, getBlogStats);

// GET /api/blogs/admin — full list (admin view)
router.get("/admin", protect, requireVerified, adminOnly, getAllBlogsAdmin);

// POST /api/blogs/admin — create a blog
router.post(
  "/admin",
  protect,
  requireVerified,
  adminOnly,
  upload.single("image"), // handle single image file in form-data
  createBlog,
);

// DELETE /api/blogs/admin/bulk — bulk delete blogs
router.delete(
  "/admin/bulk",
  protect,
  requireVerified,
  adminOnly,
  bulkDeleteBlogs,
);

// PUT /api/blogs/admin/:id — update a blog
router.put("/admin/:id", protect, requireVerified, adminOnly, updateBlog);

// DELETE /api/blogs/admin/:id — delete a blog + cleanup
router.delete("/admin/:id", protect, requireVerified, adminOnly, deleteBlog);

// PUT /api/blogs/admin/:id/toggle-featured — feature/unfeature
router.put(
  "/admin/:id/toggle-featured",
  protect,
  requireVerified,
  adminOnly,
  toggleFeatured,
);

// POST /api/blogs/admin/:id/image — upload cover image
router.post(
  "/admin/:id/image",
  protect,
  requireVerified,
  adminOnly,
  upload.single("image"), // <-- Add this
  uploadBlogImage,
);

// DELETE /api/blogs/admin/:id/image — remove cover image
router.delete(
  "/admin/:id/image",
  protect,
  requireVerified,
  adminOnly,
  deleteBlogImage,
);

// ─────────────────────────────────────────────
// PUBLIC ROUTES — must come AFTER admin routes
// ─────────────────────────────────────────────

// GET /api/blogs/featured — featured blogs
router.get("/featured", getFeaturedBlogs);

// GET /api/blogs/tags — distinct tags for filters
router.get("/tags", getAllTags);

// GET /api/blogs — paginated list, optional token
router.get("/", optionalProtect, getAllBlogs);

// GET /api/blogs/:id — single blog by ID
router.get("/:id", optionalProtect, getBlogById);

export default router;
