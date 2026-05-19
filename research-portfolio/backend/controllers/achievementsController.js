/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/achievementsController.js
// ─────────────────────────────────────────────────────────────────────────────

import { validationResult } from "express-validator";
import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
  getSignedUrl,
} from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// YOUR EXACT SCHEMA COLUMNS
// ─────────────────────────────────────────────
// id           uuid        NOT NULL  PK
// title        text        NOT NULL
// description  text        nullable
// date         date        nullable
// user_id      uuid        nullable  FK → users.id
// type         text        nullable  (Award, Patent, Grant, Fellowship, Certification, Other)
// organization text        nullable
// year         text        nullable
// status       text        nullable  (Completed, Pending, Published)
// url          text        nullable
// patent_number text       nullable
// amount       text        nullable
// tags         text[]      nullable
// pdf_url      text        nullable
// image_url    text        nullable
// created_at   timestamptz nullable
// updated_at   timestamptz nullable
// ─────────────────────────────────────────────

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

// Only keep keys that are NOT undefined so Supabase
// ignores untouched fields on update
const cleanObject = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// Parse tags — accepts array, JSON string, or comma-separated string
const parseTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed)
      ? parsed.map((t) => t.trim()).filter(Boolean)
      : [];
  } catch {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
};

// ─────────────────────────────────────────────
// FILE UPLOAD HELPERS
// ─────────────────────────────────────────────
const handleFileUpload = async (file, folder, bucket) => {
  const safeName = file.originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = `${folder}/${Date.now()}_${safeName}`;
  const publicUrl = await uploadFile(
    bucket,
    filePath,
    file.buffer,
    file.mimetype,
  );
  return publicUrl;
};

const handleFileDeletion = async (url, bucket) => {
  if (!url || url.startsWith("http")) return; // public URL — skip
  await deleteFile(bucket, url).catch(() => {});
};

// =============================================================================
// @desc    Get all achievements — search, filter, paginate
// @route   GET /api/achievements
// @access  Public
// =============================================================================
export const getAllAchievements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      type,
      status,
      year,
      tag,
      sort = "date",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = ["date", "title", "year", "created_at", "type"];
    const sortCol = allowedSorts.includes(sort) ? sort : "date";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select(
        `id, title, description, date, type, organization,
         year, status, url, patent_number, amount,
         tags, image_url, created_at`,
        { count: "exact" },
      )
      .order(sortCol, { ascending, nullsFirst: false })
      .range(offset, offset + limitNum - 1);

    // ── Filters ──────────────────────────────────────────────────────────────
    if (search?.trim()) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,organization.ilike.%${search}%`,
      );
    }

    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", year);

    // Filter by a single tag inside the ARRAY column
    if (tag?.trim()) {
      query = query.contains("tags", [tag.trim()]);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Achievements] getAllAchievements error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch achievements.",
      });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Achievements] getAllAchievements exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single achievement by ID
// @route   GET /api/achievements/:id
// @access  Public
// =============================================================================
export const getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: achievement, error } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found.",
      });
    }

    // Generate signed URL for private PDF paths
    if (achievement.pdf_url && !achievement.pdf_url.startsWith("http")) {
      try {
        achievement.pdf_url = await getSignedUrl(
          STORAGE_BUCKETS.ACHIEVEMENT_FILES,
          achievement.pdf_url,
          3600,
        );
      } catch {
        achievement.pdf_url = null;
      }
    }

    return res.status(200).json({ success: true, data: achievement });
  } catch (err) {
    console.error("[Achievements] getAchievementById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct meta values for filter UI
// @route   GET /api/achievements/meta
// @access  Public
// =============================================================================
export const getAchievementMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("type, status, year, tags");

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch metadata.",
      });
    }

    const types = [...new Set(data.map((a) => a.type).filter(Boolean))].sort();
    const statuses = [
      ...new Set(data.map((a) => a.status).filter(Boolean)),
    ].sort();
    const years = [...new Set(data.map((a) => a.year).filter(Boolean))].sort(
      (a, b) => b - a,
    );
    const tags = [...new Set(data.flatMap((a) => a.tags || []))].sort();

    return res.status(200).json({
      success: true,
      data: { types, statuses, years, tags },
    });
  } catch (err) {
    console.error("[Achievements] getAchievementMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — create an achievement
// @route   POST /api/achievements/admin
// @access  Private + Admin
// =============================================================================
export const createAchievement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: formatErrors(errors),
      });
    }

    const {
      title,
      description,
      date,
      type,
      organization,
      year,
      status,
      url,
      patent_number,
      amount,
      tags,
    } = req.body;

    // ── Handle file uploads ───────────────────────────────────────────────────
    let pdf_url = req.body.pdf_url || null;
    let image_url = req.body.image_url || null;

    if (req.files?.pdf?.[0]) {
      try {
        pdf_url = await handleFileUpload(
          req.files.pdf[0],
          `achievements/${req.user.id}`,
          STORAGE_BUCKETS.ACHIEVEMENT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Achievements] PDF upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
    }

    if (req.files?.image?.[0]) {
      try {
        image_url = await handleFileUpload(
          req.files.image[0],
          `achievements/${req.user.id}`,
          STORAGE_BUCKETS.ACHIEVEMENT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Achievements] Image upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
    }

    const tagsArr = parseTags(tags);

    const { data: achievement, error } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .insert([
        cleanObject({
          title: title.trim(),
          description: description?.trim() || null,
          date: date || null,
          user_id: req.user.id,
          type: type || null,
          organization: organization?.trim() || null,
          year: year?.toString() || null,
          status: status || null,
          url: url?.trim() || null,
          patent_number: patent_number?.trim() || null,
          amount: amount?.trim() || null,
          tags: tagsArr,
          pdf_url,
          image_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "[Achievements] createAchievement DB error:",
        error.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create achievement.",
      });
    }

    console.log(
      `[Achievements] Created: "${achievement.title}" by ${req.user.email}`,
    );

    return res.status(201).json({
      success: true,
      message: "Achievement created successfully.",
      data: achievement,
    });
  } catch (err) {
    console.error("[Achievements] createAchievement exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — update an achievement
// @route   PUT /api/achievements/admin/:id
// @access  Private + Admin
// =============================================================================
export const updateAchievement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: formatErrors(errors),
      });
    }

    const { id } = req.params;

    // Fetch existing to get current file URLs for cleanup
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("id, title, pdf_url, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found.",
      });
    }

    const {
      title,
      description,
      date,
      type,
      organization,
      year,
      status,
      url,
      patent_number,
      amount,
      tags,
    } = req.body;

    // ── Handle file replacements ──────────────────────────────────────────────
    let pdf_url = req.body.pdf_url; // undefined = no change
    let image_url = req.body.image_url; // undefined = no change

    if (req.files?.pdf?.[0]) {
      // Delete old PDF
      await handleFileDeletion(
        existing.pdf_url,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      );
      try {
        pdf_url = await handleFileUpload(
          req.files.pdf[0],
          `achievements/${req.user.id}`,
          STORAGE_BUCKETS.ACHIEVEMENT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Achievements] PDF upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
    }

    if (req.files?.image?.[0]) {
      // Delete old image
      await handleFileDeletion(
        existing.image_url,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      );
      try {
        image_url = await handleFileUpload(
          req.files.image[0],
          `achievements/${req.user.id}`,
          STORAGE_BUCKETS.ACHIEVEMENT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Achievements] Image upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
    }

    const tagsArr = tags !== undefined ? parseTags(tags) : undefined;

    const updates = cleanObject({
      title: title?.trim(),
      description: description?.trim() || null,
      date: date || null,
      type: type || null,
      organization: organization?.trim() || null,
      year: year?.toString() || null,
      status: status || null,
      url: url?.trim() || null,
      patent_number: patent_number?.trim() || null,
      amount: amount?.trim() || null,
      tags: tagsArr,
      pdf_url,
      image_url,
      updated_at: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "[Achievements] updateAchievement DB error:",
        updateError.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update achievement.",
      });
    }

    console.log(
      `[Achievements] Updated: "${updated.title}" by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: "Achievement updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[Achievements] updateAchievement exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — delete a single achievement
// @route   DELETE /api/achievements/admin/:id
// @access  Private + Admin
// =============================================================================
export const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: achievement, error: fetchError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("id, title, pdf_url, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found.",
      });
    }

    // Delete associated files from Supabase Storage
    await Promise.allSettled([
      handleFileDeletion(
        achievement.pdf_url,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      ),
      handleFileDeletion(
        achievement.image_url,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      ),
    ]);

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "[Achievements] deleteAchievement DB error:",
        deleteError.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete achievement.",
      });
    }

    console.log(
      `[Achievements] Deleted: "${achievement.title}" (id: ${id}) by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: "Achievement deleted successfully.",
    });
  } catch (err) {
    console.error("[Achievements] deleteAchievement exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — bulk delete achievements
// @route   DELETE /api/achievements/admin/bulk
// @access  Private + Admin
// =============================================================================
export const bulkDeleteAchievements = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids must be a non-empty array of UUIDs.",
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete more than 50 achievements at once.",
      });
    }

    // Fetch file URLs for cleanup
    const { data: achievements } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("id, pdf_url, image_url")
      .in("id", ids);

    // Delete all associated files
    const deletionPromises = (achievements || []).flatMap((a) => [
      handleFileDeletion(a.pdf_url, STORAGE_BUCKETS.ACHIEVEMENT_FILES),
      handleFileDeletion(a.image_url, STORAGE_BUCKETS.ACHIEVEMENT_FILES),
    ]);
    await Promise.allSettled(deletionPromises);

    const { error, count } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      console.error(
        "[Achievements] bulkDeleteAchievements DB error:",
        error.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete achievements.",
      });
    }

    console.log(
      `[Achievements] Bulk deleted ${count} achievements by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `${count} achievement(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error(
      "[Achievements] bulkDeleteAchievements exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — upload or replace achievement image
// @route   POST /api/achievements/admin/:id/image
// @access  Private + Admin
// =============================================================================
export const uploadAchievementImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    const { id } = req.params;

    const { data: achievement, error: fetchError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("id, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found.",
      });
    }

    // Delete old image
    await handleFileDeletion(
      achievement.image_url,
      STORAGE_BUCKETS.ACHIEVEMENT_FILES,
    );

    let image_url;
    try {
      image_url = await handleFileUpload(
        req.file,
        `achievements/${req.user.id}`,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      );
    } catch (uploadErr) {
      console.error(
        "[Achievements] uploadAchievementImage upload error:",
        uploadErr.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .update({ image_url, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "Achievement image uploaded successfully.",
      data: { image_url },
    });
  } catch (err) {
    console.error(
      "[Achievements] uploadAchievementImage exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — upload or replace achievement PDF
// @route   POST /api/achievements/admin/:id/pdf
// @access  Private + Admin
// =============================================================================
export const uploadAchievementPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file provided.",
      });
    }

    const { id } = req.params;

    const { data: achievement, error: fetchError } = await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("id, pdf_url")
      .eq("id", id)
      .single();

    if (fetchError || !achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found.",
      });
    }

    // Delete old PDF
    await handleFileDeletion(
      achievement.pdf_url,
      STORAGE_BUCKETS.ACHIEVEMENT_FILES,
    );

    let pdf_url;
    try {
      pdf_url = await handleFileUpload(
        req.file,
        `achievements/${req.user.id}`,
        STORAGE_BUCKETS.ACHIEVEMENT_FILES,
      );
    } catch (uploadErr) {
      console.error(
        "[Achievements] uploadAchievementPDF upload error:",
        uploadErr.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "PDF upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .update({ pdf_url, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "Achievement PDF uploaded successfully.",
      data: { pdf_url },
    });
  } catch (err) {
    console.error(
      "[Achievements] uploadAchievementPDF exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get achievement stats for dashboard
// @route   GET /api/achievements/admin/stats
// @access  Private + Admin
// =============================================================================
export const getAchievementStats = async (req, res) => {
  try {
    const [totalRes, typeRes, statusRes] = await Promise.all([
      supabaseAdmin
        .from(TABLES.ACHIEVEMENTS)
        .select("id", { count: "exact", head: true }),

      supabaseAdmin.from(TABLES.ACHIEVEMENTS).select("type"),

      supabaseAdmin.from(TABLES.ACHIEVEMENTS).select("status"),
    ]);

    const byType = (typeRes.data || []).reduce((acc, { type }) => {
      if (type) acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const byStatus = (statusRes.data || []).reduce((acc, { status }) => {
      if (status) acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        byType,
        byStatus,
      },
    });
  } catch (err) {
    console.error("[Achievements] getAchievementStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — list all achievements (manage page, all fields)
// @route   GET /api/achievements/admin/all
// @access  Private + Admin
// =============================================================================
export const adminGetAllAchievements = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, status, year } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.ACHIEVEMENTS)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search?.trim()) {
      query = query.or(
        `title.ilike.%${search}%,organization.ilike.%${search}%`,
      );
    }
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", year);

    const { data, error, count } = await query;

    if (error) {
      console.error(
        "[Achievements] adminGetAllAchievements error:",
        error.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch achievements.",
      });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error(
      "[Achievements] adminGetAllAchievements exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
