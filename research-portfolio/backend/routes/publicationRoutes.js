// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/publicationRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  getPublications,
  getPublicationById,
  getPublicationMeta,
  getFeaturedPublications,
  searchPublications,
  createPublication,
  updatePublication,
  downloadPublication,
  // Admin handlers
  getPublicationStats,
  adminGetAllPublications,
  adminManagePublications,
  adminDeletePublication,
  adminFeaturePublication,
  adminUnfeaturePublication,
} from "../controllers/publicationController.js";

import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { requireVerified, adminOnly } from "../middleware/roleMiddleware.js";
import { uploadPDFMiddleware } from "../middleware/uploadMiddleware.js";
const router = express.Router();

// ─────────────────────────────────────────────
// MULTER ERROR WRAPPER
// Returns clean JSON instead of crashing Express
// ─────────────────────────────────────────────

// =============================================================================
// PUBLIC ROUTES  (no token required)
// Guests and logged-in users can browse / view
// =============================================================================

// GET /api/publications/featured  ← BEFORE /:id to avoid route conflict
router.get("/featured", getFeaturedPublications);

// GET /api/publications/search?q=<query>  ← BEFORE /:id
router.get("/search", searchPublications);

// GET /api/publications/meta  ← BEFORE /:id
router.get("/meta", getPublicationMeta);

// GET /api/publications
router.get("/", optionalProtect, getPublications);

// GET /api/publications/:id
// Returns public fields only — pdf_url is stripped, has_pdf flag added
router.get("/:id", optionalProtect, getPublicationById);

// =============================================================================
// PROTECTED ROUTES — logged-in + verified users only
// =============================================================================

// GET /api/publications/:id/download
// Generates a 60-min signed Supabase URL for the PDF
// Flow: Guest ❌  |  Logged-in ✅  |  Admin ✅
router.get("/:id/download", protect, requireVerified, downloadPublication);

// =============================================================================
// ADMIN ROUTES  /admin/*
// All require: protect → requireVerified → adminOnly
// =============================================================================

// GET /api/publications/admin/stats
router.get(
  "/admin/stats",
  protect,
  requireVerified,
  adminOnly,
  getPublicationStats,
);

// GET /api/publications/admin/all
router.get(
  "/admin/all",
  protect,
  requireVerified,
  adminOnly,
  adminGetAllPublications,
);

// GET /api/publications/admin/manage-publications
router.get(
  "/admin/manage-publications",
  protect,
  requireVerified,
  adminOnly,
  adminManagePublications,
);

// POST /api/publications/admin
// Admin creates a publication — optional PDF via multipart/form-data
// Field name for file: "pdf"
router.post(
  "/admin",
  protect,
  requireVerified,
  adminOnly,
  uploadPDFMiddleware,
  createPublication,
);

// PUT /api/publications/admin/:id
// Admin updates any publication — optional new PDF
// Field name for file: "pdf"
router.put(
  "/admin/:id",
  protect,
  requireVerified,
  adminOnly,
  uploadPDFMiddleware,
  updatePublication,
);

// DELETE /api/publications/admin/:id
// Admin force-deletes publication + removes PDF from Supabase Storage
router.delete(
  "/admin/:id",
  protect,
  requireVerified,
  adminOnly,
  adminDeletePublication,
);

// PATCH /api/publications/admin/:id/feature
router.patch(
  "/admin/:id/feature",
  protect,
  requireVerified,
  adminOnly,
  adminFeaturePublication,
);

// PATCH /api/publications/admin/:id/unfeature
router.patch(
  "/admin/:id/unfeature",
  protect,
  requireVerified,
  adminOnly,
  adminUnfeaturePublication,
);

export default router;
