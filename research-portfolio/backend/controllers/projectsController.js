/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/projectsController.js
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
// SCHEMA COLUMNS
// ─────────────────────────────────────────────
// id           uuid        NOT NULL  PK
// title        text        NOT NULL
// description  text        nullable
// category     text        nullable
// tags         text[]      nullable
// files        text[]      nullable  (array of file URLs)
// owner_id     uuid        nullable  FK → users.id
// visibility   text        nullable  (public / private)
// image        text        nullable
// github_url   text        nullable
// demo_url     text        nullable
// stars        int         nullable
// forks        int         nullable
// year         text        nullable
// status       text        nullable  (Completed / Ongoing)
// featured     bool        nullable
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

const cleanObject = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

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
  return await uploadFile(bucket, filePath, file.buffer, file.mimetype);
};

const handleFileDeletion = async (url, bucket) => {
  if (!url || url.startsWith("http")) return;
  await deleteFile(bucket, url).catch(() => {});
};

// =============================================================================
// @desc    Get all projects — search, filter, paginate
// @route   GET /api/projects
// @access  Public
// =============================================================================
export const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      status,
      year,
      tag,
      featured,
      visibility = "public",
      sort = "created_at",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = [
      "created_at",
      "title",
      "year",
      "stars",
      "forks",
      "status",
    ];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.PROJECTS)
      .select(
        `id, title, description, category, tags, image,
         github_url, demo_url, stars, forks, year,
         status, featured, visibility, created_at`,
        { count: "exact" },
      )
      .order(sortCol, { ascending, nullsFirst: false })
      .range(offset, offset + limitNum - 1);

    // Public route only shows public projects
    if (visibility) query = query.eq("visibility", visibility);
    if (search?.trim())
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", year);
    if (featured === "true") query = query.eq("featured", true);
    if (tag?.trim()) query = query.contains("tags", [tag.trim()]);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Projects] getAllProjects error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch projects." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Projects] getAllProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
// =============================================================================
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Generate signed URLs for private file paths
    if (Array.isArray(project.files)) {
      project.files = await Promise.all(
        project.files.map(async (fileUrl) => {
          if (fileUrl && !fileUrl.startsWith("http")) {
            try {
              return await getSignedUrl(
                STORAGE_BUCKETS.PROJECT_FILES,
                fileUrl,
                3600,
              );
            } catch {
              return null;
            }
          }
          return fileUrl;
        }),
      );
      project.files = project.files.filter(Boolean);
    }

    return res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error("[Projects] getProjectById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct meta values for filter UI
// @route   GET /api/projects/meta
// @access  Public
// =============================================================================
export const getProjectMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("category, status, year, tags, visibility");

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch metadata." });
    }

    const categories = [
      ...new Set(data.map((p) => p.category).filter(Boolean)),
    ].sort();
    const statuses = [
      ...new Set(data.map((p) => p.status).filter(Boolean)),
    ].sort();
    const years = [...new Set(data.map((p) => p.year).filter(Boolean))].sort(
      (a, b) => b - a,
    );
    const tags = [...new Set(data.flatMap((p) => p.tags || []))].sort();

    return res.status(200).json({
      success: true,
      data: { categories, statuses, years, tags },
    });
  } catch (err) {
    console.error("[Projects] getProjectMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — create a project
// @route   POST /api/projects/admin
// @access  Private + Admin
// =============================================================================
export const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const {
      title,
      description,
      category,
      tags,
      visibility,
      github_url,
      demo_url,
      stars,
      forks,
      year,
      status,
      featured,
    } = req.body;

    // ── Handle image upload ───────────────────────────────────────────────────
    let image = req.body.image || null;
    if (req.files?.image?.[0]) {
      try {
        image = await handleFileUpload(
          req.files.image[0],
          `projects/${req.user.id}`,
          STORAGE_BUCKETS.PROJECT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Projects] Image upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
    }

    // ── Handle multiple file uploads ──────────────────────────────────────────
    let fileUrls = [];
    if (req.files?.files?.length) {
      try {
        fileUrls = await Promise.all(
          req.files.files.map((f) =>
            handleFileUpload(
              f,
              `projects/${req.user.id}/files`,
              STORAGE_BUCKETS.PROJECT_FILES,
            ),
          ),
        );
      } catch (uploadErr) {
        console.error("[Projects] File upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "File upload failed." });
      }
    }

    const tagsArr = parseTags(tags);
    const featuredBool =
      featured === true || featured === "true" || featured === "1";

    const { data: project, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .insert([
        cleanObject({
          title: title.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          tags: tagsArr,
          files: fileUrls.length ? fileUrls : [],
          owner_id: req.user.id,
          visibility: visibility || "public",
          image,
          github_url: github_url?.trim() || null,
          demo_url: demo_url?.trim() || null,
          stars: stars ? parseInt(stars, 10) : null,
          forks: forks ? parseInt(forks, 10) : null,
          year: year ? String(year).trim() : null,
          status: status || null,
          featured: featuredBool,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error("[Projects] createProject DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create project." });
    }

    console.log(`[Projects] Created: "${project.title}" by ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (err) {
    console.error("[Projects] createProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — update a project
// @route   PUT /api/projects/admin/:id
// @access  Private + Admin
// =============================================================================
export const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, title, image, files")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const {
      title,
      description,
      category,
      tags,
      visibility,
      github_url,
      demo_url,
      stars,
      forks,
      year,
      status,
      featured,
    } = req.body;

    // ── Handle image replacement ──────────────────────────────────────────────
    let image = req.body.image; // undefined = no change
    if (req.files?.image?.[0]) {
      await handleFileDeletion(existing.image, STORAGE_BUCKETS.PROJECT_FILES);
      try {
        image = await handleFileUpload(
          req.files.image[0],
          `projects/${req.user.id}`,
          STORAGE_BUCKETS.PROJECT_FILES,
        );
      } catch (uploadErr) {
        console.error("[Projects] Image upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
    }

    // ── Handle additional file uploads (appended to existing) ─────────────────
    let files = undefined; // undefined = no change
    if (req.files?.files?.length) {
      try {
        const newFileUrls = await Promise.all(
          req.files.files.map((f) =>
            handleFileUpload(
              f,
              `projects/${req.user.id}/files`,
              STORAGE_BUCKETS.PROJECT_FILES,
            ),
          ),
        );
        // Append new files to existing ones
        files = [...(existing.files || []), ...newFileUrls];
      } catch (uploadErr) {
        console.error("[Projects] File upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "File upload failed." });
      }
    }

    const tagsArr = tags !== undefined ? parseTags(tags) : undefined;
    const featuredBool =
      featured !== undefined
        ? featured === true || featured === "true" || featured === "1"
        : undefined;

    const updates = cleanObject({
      title: title?.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      tags: tagsArr,
      files,
      visibility: visibility || undefined,
      image,
      github_url: github_url?.trim() || null,
      demo_url: demo_url?.trim() || null,
      stars: stars !== undefined ? parseInt(stars, 10) : undefined,
      forks: forks !== undefined ? parseInt(forks, 10) : undefined,
      year: year !== undefined ? String(year).trim() : undefined,
      status: status || null,
      featured: featuredBool,
      updated_at: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Projects] updateProject DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update project." });
    }

    console.log(`[Projects] Updated: "${updated.title}" by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[Projects] updateProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — delete a single project
// @route   DELETE /api/projects/admin/:id
// @access  Private + Admin
// =============================================================================
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, title, image, files")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Delete image + all associated files
    const deletionPromises = [
      handleFileDeletion(project.image, STORAGE_BUCKETS.PROJECT_FILES),
      ...(project.files || []).map((f) =>
        handleFileDeletion(f, STORAGE_BUCKETS.PROJECT_FILES),
      ),
    ];
    await Promise.allSettled(deletionPromises);

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Projects] deleteProject DB error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete project." });
    }

    console.log(
      `[Projects] Deleted: "${project.title}" (id: ${id}) by ${req.user.email}`,
    );

    return res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (err) {
    console.error("[Projects] deleteProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — bulk delete projects
// @route   DELETE /api/projects/admin/bulk
// @access  Private + Admin
// =============================================================================
export const bulkDeleteProjects = async (req, res) => {
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
        message: "Cannot delete more than 50 projects at once.",
      });
    }

    const { data: projects } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, image, files")
      .in("id", ids);

    const deletionPromises = (projects || []).flatMap((p) => [
      handleFileDeletion(p.image, STORAGE_BUCKETS.PROJECT_FILES),
      ...(p.files || []).map((f) =>
        handleFileDeletion(f, STORAGE_BUCKETS.PROJECT_FILES),
      ),
    ]);
    await Promise.allSettled(deletionPromises);

    const { error, count } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      console.error("[Projects] bulkDeleteProjects DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete projects." });
    }

    console.log(
      `[Projects] Bulk deleted ${count} projects by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `${count} project(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error("[Projects] bulkDeleteProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — toggle featured flag
// @route   PATCH /api/projects/admin/:id/featured
// @access  Private + Admin
// =============================================================================
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, title, featured")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const newFeatured = !project.featured;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({ featured: newFeatured, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, featured")
      .single();

    if (updateError) {
      console.error("[Projects] toggleFeatured DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update featured status." });
    }

    console.log(
      `[Projects] Featured toggled: "${updated.title}" → ${newFeatured} by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `Project ${newFeatured ? "marked as featured" : "removed from featured"}.`,
      data: updated,
    });
  } catch (err) {
    console.error("[Projects] toggleFeatured exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — upload or replace project image
// @route   POST /api/projects/admin/:id/image
// @access  Private + Admin
// =============================================================================
export const uploadProjectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided." });
    }

    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, image")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    await handleFileDeletion(project.image, STORAGE_BUCKETS.PROJECT_FILES);

    let image;
    try {
      image = await handleFileUpload(
        req.file,
        `projects/${req.user.id}`,
        STORAGE_BUCKETS.PROJECT_FILES,
      );
    } catch (uploadErr) {
      console.error(
        "[Projects] uploadProjectImage upload error:",
        uploadErr.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({ image, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "Project image uploaded successfully.",
      data: { image },
    });
  } catch (err) {
    console.error("[Projects] uploadProjectImage exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — upload additional files to a project
// @route   POST /api/projects/admin/:id/files
// @access  Private + Admin
// =============================================================================
export const uploadProjectFiles = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No files provided." });
    }

    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, files")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    let newFileUrls;
    try {
      newFileUrls = await Promise.all(
        req.files.map((f) =>
          handleFileUpload(
            f,
            `projects/${req.user.id}/files`,
            STORAGE_BUCKETS.PROJECT_FILES,
          ),
        ),
      );
    } catch (uploadErr) {
      console.error(
        "[Projects] uploadProjectFiles upload error:",
        uploadErr.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "File upload failed." });
    }

    const updatedFiles = [...(project.files || []), ...newFileUrls];

    await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({ files: updatedFiles, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: `${newFileUrls.length} file(s) uploaded successfully.`,
      data: { files: updatedFiles },
    });
  } catch (err) {
    console.error("[Projects] uploadProjectFiles exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get project stats for dashboard
// @route   GET /api/projects/admin/stats
// @access  Private + Admin
// =============================================================================
export const getProjectStats = async (req, res) => {
  try {
    const [totalRes, categoryRes, statusRes, featuredRes] = await Promise.all([
      supabaseAdmin
        .from(TABLES.PROJECTS)
        .select("id", { count: "exact", head: true }),
      supabaseAdmin.from(TABLES.PROJECTS).select("category"),
      supabaseAdmin.from(TABLES.PROJECTS).select("status"),
      supabaseAdmin
        .from(TABLES.PROJECTS)
        .select("id", { count: "exact", head: true })
        .eq("featured", true),
    ]);

    const byCategory = (categoryRes.data || []).reduce((acc, { category }) => {
      if (category) acc[category] = (acc[category] || 0) + 1;
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
        featured: featuredRes.count ?? 0,
        byCategory,
        byStatus,
      },
    });
  } catch (err) {
    console.error("[Projects] getProjectStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — list all projects (manage page, all fields)
// @route   GET /api/projects/admin/all
// @access  Private + Admin
// =============================================================================
export const adminGetAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      year,
      visibility,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search?.trim())
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", year);
    if (visibility) query = query.eq("visibility", visibility);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Projects] adminGetAllProjects error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch projects." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Projects] adminGetAllProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
