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

import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  deleteFile,
} from "../config/supabaseClient.js";

import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { requireVerified, adminOnly } from "../middleware/roleMiddleware.js";
import { uploadPDFMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES  (no token required)
// =============================================================================

// GET /api/publications/featured  ← BEFORE /:id to avoid route conflict
router.get("/featured", getFeaturedPublications);

// GET /api/publications/search?q=<query>  ← BEFORE /:id
router.get("/search", searchPublications);

// GET /api/publications/meta  ← BEFORE /:id
router.get("/meta", getPublicationMeta);

// =============================================================================
// ADMIN ROUTES  /admin/*  ← MUST be before /:id — "admin" would match /:id
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
router.post(
  "/admin",
  protect,
  requireVerified,
  adminOnly,
  uploadPDFMiddleware,
  createPublication,
);

// PUT /api/publications/admin/:id
router.put(
  "/admin/:id",
  protect,
  requireVerified,
  adminOnly,
  uploadPDFMiddleware,
  updatePublication,
);

// DELETE /api/publications/admin/bulk  ← MUST be before /admin/:id
router.delete(
  "/admin/bulk",
  protect,
  requireVerified,
  adminOnly,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ids must be a non-empty array of UUIDs.",
        });
      }

      if (ids.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete more than 100 publications at once.",
        });
      }

      // Fetch pdf_urls so we can clean up storage
      const { data: pubs } = await supabaseAdmin
        .from(TABLES.PUBLICATIONS)
        .select("id, pdf_url")
        .in("id", ids);

      // Delete PDFs from Supabase Storage (fire-and-forget per file)
      await Promise.allSettled(
        (pubs || [])
          .filter((p) => p.pdf_url && !p.pdf_url.startsWith("http"))
          .map((p) =>
            deleteFile(STORAGE_BUCKETS.PUBLICATION_PDFS, p.pdf_url).catch(
              () => {},
            ),
          ),
      );

      // Delete rows
      const { error, count } = await supabaseAdmin
        .from(TABLES.PUBLICATIONS)
        .delete({ count: "exact" })
        .in("id", ids);

      if (error) {
        console.error("[Publications] bulkDelete DB error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Failed to delete publications.",
        });
      }

      console.log(
        `[Publications] Bulk deleted ${count} publications by admin: ${req.user.email}`,
      );

      return res.status(200).json({
        success: true,
        message: `${count} publication(s) deleted successfully.`,
        deleted: count,
      });
    } catch (err) {
      console.error("[Publications] bulkDelete exception:", err.message);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

// DELETE /api/publications/admin/:id
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

// =============================================================================
// PUBLIC ROUTES (continued) — /:id MUST come after all static/admin paths
// =============================================================================

// GET /api/publications
router.get("/", optionalProtect, getPublications);

// GET /api/publications/:id
router.get("/:id", optionalProtect, getPublicationById);

// =============================================================================
// PROTECTED ROUTES — logged-in + verified users only
// =============================================================================

// GET /api/publications/:id/download
router.get("/:id/download", protect, requireVerified, downloadPublication);

export default router;
