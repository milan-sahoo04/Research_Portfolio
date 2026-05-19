/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/feedbackController.js
// ─────────────────────────────────────────────────────────────────────────────

import { validationResult } from "express-validator";
import { supabaseAdmin, TABLES } from "../config/supabaseClient.js";
import {
  sendContactNotificationEmail,
  sendContactConfirmationEmail,
} from "../utils/email.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

const buildPagination = (page, limit, total) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

// =============================================================================
// @desc    Submit feedback / contact form
// @route   POST /api/feedback
// @access  Public
// =============================================================================
export const submitFeedback = async (req, res) => {
  try {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: formatErrors(errors),
      });
    }

    const { name, email, subject, message } = req.body;

    // ── Insert into DB ────────────────────────────────────────────────────────
    const { data: feedback, error } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .insert([
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          subject: subject?.trim() || null,
          message: message.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, name, email, subject, created_at")
      .single();

    if (error) {
      console.error("[Feedback] submitFeedback DB error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to submit feedback. Please try again.",
      });
    }

    // ── Send emails (fire-and-forget — never block the response) ─────────────
    const adminEmail = process.env.SMTP_USER;

    Promise.allSettled([
      // Notify admin
      sendContactNotificationEmail({
        adminEmail,
        senderName: name.trim(),
        senderEmail: email.toLowerCase().trim(),
        subject: subject?.trim() || "(No subject)",
        message: message.trim(),
      }),
      // Confirm to sender
      sendContactConfirmationEmail({
        to: email.toLowerCase().trim(),
        name: name.trim(),
        subject: subject?.trim() || "your message",
      }),
    ]).catch(() => {});

    console.log(`[Feedback] New submission from ${email} — id: ${feedback.id}`);

    return res.status(201).json({
      success: true,
      message:
        "Thank you! Your message has been received. We'll get back to you soon.",
      data: {
        id: feedback.id,
        created_at: feedback.created_at,
      },
    });
  } catch (err) {
    console.error("[Feedback] submitFeedback exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get all feedback messages (admin)
// @route   GET /api/feedback/admin
// @access  Private + Admin
// =============================================================================
export const getAllFeedback = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = ["created_at", "name", "email"];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.FEEDBACK)
      .select("id, name, email, subject, message, created_at", {
        count: "exact",
      })
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    // Search across name, email, subject, message
    if (search?.trim()) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Feedback] getAllFeedback error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch feedback.",
      });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Feedback] getAllFeedback exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single feedback message by ID (admin)
// @route   GET /api/feedback/admin/:id
// @access  Private + Admin
// =============================================================================
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: feedback, error } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback message not found.",
      });
    }

    return res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    console.error("[Feedback] getFeedbackById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Delete a feedback message (admin)
// @route   DELETE /api/feedback/admin/:id
// @access  Private + Admin
// =============================================================================
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify it exists first
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .select("id, name, email")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Feedback message not found.",
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Feedback] deleteFeedback DB error:", deleteError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to delete feedback.",
      });
    }

    console.log(
      `[Feedback] Deleted id: ${id} (from: ${existing.email}) by admin: ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: "Feedback message deleted successfully.",
    });
  } catch (err) {
    console.error("[Feedback] deleteFeedback exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Delete multiple feedback messages at once (admin)
// @route   DELETE /api/feedback/admin/bulk
// @access  Private + Admin
// =============================================================================
export const bulkDeleteFeedback = async (req, res) => {
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
        message: "Cannot delete more than 100 messages at once.",
      });
    }

    const { error, count } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      console.error("[Feedback] bulkDeleteFeedback DB error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to delete feedback messages.",
      });
    }

    console.log(
      `[Feedback] Bulk deleted ${count} messages by admin: ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `${count} feedback message(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error("[Feedback] bulkDeleteFeedback exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get feedback stats for admin dashboard
// @route   GET /api/feedback/admin/stats
// @access  Private + Admin
// =============================================================================
export const getFeedbackStats = async (req, res) => {
  try {
    const [totalRes, todayRes, weekRes] = await Promise.all([
      // Total count
      supabaseAdmin
        .from(TABLES.FEEDBACK)
        .select("id", { count: "exact", head: true }),

      // Today's count
      supabaseAdmin
        .from(TABLES.FEEDBACK)
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]),

      // This week's count
      supabaseAdmin
        .from(TABLES.FEEDBACK)
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        today: todayRes.count ?? 0,
        thisWeek: weekRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error("[Feedback] getFeedbackStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
