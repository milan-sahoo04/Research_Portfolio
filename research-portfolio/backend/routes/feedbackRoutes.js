// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/feedbackRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { body, param } from "express-validator";
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  deleteFeedback,
  bulkDeleteFeedback,
  getFeedbackStats,
} from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────────
// VALIDATION CHAINS
// ─────────────────────────────────────────────
const submitValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ max: 100 })
    .withMessage("Name must be under 100 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),

  body("subject")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject must be under 200 characters."),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required.")
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters.")
    .isLength({ max: 2000 })
    .withMessage("Message must be under 2000 characters."),
];

const idValidation = [
  param("id").isUUID().withMessage("Invalid feedback ID format."),
];

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// POST /api/feedback
// Submit a contact / feedback message — no auth required
router.post("/", submitValidation, submitFeedback);

// ─────────────────────────────────────────────
// ADMIN ROUTES  (protect + adminOnly on all)
// ─────────────────────────────────────────────

// GET /api/feedback/admin/stats
// Must be defined BEFORE /admin/:id to avoid "stats" being treated as an id
router.get("/admin/stats", protect, adminOnly, getFeedbackStats);

// GET /api/feedback/admin
// List all feedback with pagination + search
router.get("/admin", protect, adminOnly, getAllFeedback);

// GET /api/feedback/admin/:id
// Get single feedback message
router.get("/admin/:id", protect, adminOnly, idValidation, getFeedbackById);

// DELETE /api/feedback/admin/bulk
// Delete multiple messages at once
// Body: { ids: ["uuid1", "uuid2", ...] }
router.delete("/admin/bulk", protect, adminOnly, bulkDeleteFeedback);

// DELETE /api/feedback/admin/:id
// Delete single feedback message
router.delete("/admin/:id", protect, adminOnly, idValidation, deleteFeedback);

export default router;
