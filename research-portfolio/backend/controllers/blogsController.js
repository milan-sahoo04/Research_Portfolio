/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/blogsController.js
// ─────────────────────────────────────────────────────────────────────────────

import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
  extractStoragePath,
} from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// BLOG TABLE SCHEMA
// ─────────────────────────────────────────────
// id          uuid        PK
// title       text
// content     text
// excerpt     text
// tags        text[]
// image_url   text
// featured    boolean
// author_id   uuid        FK → users.id
// created_at  timestamptz
// updated_at  timestamptz
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// Fields returned for public list views (no heavy content)
const LIST_SELECT = `
  id, title, excerpt, tags, image_url,
  featured, author_id, created_at, updated_at
`;

// Fields returned for single blog / admin views (includes content)
// const FULL_SELECT = `
//   id, title, content, excerpt, tags, image_url,
//   featured, author_id, created_at, updated_at
// `;

// Use only actual columns from Supabase table
const FULL_SELECT = `
id,
title,
content,
tags,
author_id,
created_at,
updated_at,
excerpt,
image_url,
featured
`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function ok(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function buildPagination(page, limit, total) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
}

/** Strip markdown and return first 160 chars as excerpt */
function generateExcerpt(content = "") {
  return content
    .replace(/#+\s/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 160)
    .trim()
    .concat("...");
}

/**
 * Upload an image file to Supabase Storage under BLOG_IMAGES bucket.
 * Returns the public URL string.
 * Throws on failure.
 */
async function uploadBlogImageToStorage(file, blogId) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("File too large. Maximum size is 5 MB.");
  }

  const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg");
  const filePath = `${blogId}/cover-${Date.now()}.${ext}`;

  const publicUrl = await uploadFile(
    STORAGE_BUCKETS.BLOG_IMAGES,
    filePath,
    file.buffer,
    file.mimetype,
  );

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage given its full public URL.
 * Silent on failure — storage cleanup is best-effort.
 */
async function deleteOldImage(imageUrl) {
  if (!imageUrl) return;
  try {
    const imgPath = extractStoragePath(imageUrl, STORAGE_BUCKETS.BLOG_IMAGES);
    await deleteFile(STORAGE_BUCKETS.BLOG_IMAGES, imgPath);
  } catch (e) {
    console.warn("[Blogs] deleteOldImage: storage cleanup failed:", e.message);
  }
}

// =============================================================================
// PUBLIC CONTROLLERS
// =============================================================================

// =============================================================================
// @desc    Get all blogs — paginated, filterable, searchable
// @route   GET /api/blogs
// @access  Public
// =============================================================================
export const getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tag,
      featured,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = ["created_at", "updated_at", "title"];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.BLOGS)
      .select(LIST_SELECT, { count: "exact" })
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    if (featured === "true") query = query.eq("featured", true);
    if (tag?.trim()) query = query.contains("tags", [tag.trim()]);
    if (search?.trim()) {
      query = query.or(
        `title.ilike.%${search.trim()}%,excerpt.ilike.%${search.trim()}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Blogs] getAllBlogs error:", error.message);
      return fail(res, "Failed to fetch blogs.", 500);
    }

    return ok(res, {
      data: data || [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Blogs] getAllBlogs exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Get single blog by ID
// @route   GET /api/blogs/:id
// @access  Public
// =============================================================================
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: blog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select(FULL_SELECT)
      .eq("id", id)
      .single();

    if (error || !blog) return fail(res, "Blog not found.", 404);

    return ok(res, { data: blog });
  } catch (err) {
    console.error("[Blogs] getBlogById exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Get featured blogs (homepage)
// @route   GET /api/blogs/featured
// @access  Public
// =============================================================================
export const getFeaturedBlogs = async (req, res) => {
  try {
    const limitNum = Math.min(
      10,
      Math.max(1, parseInt(req.query.limit || "6", 10)),
    );

    const { data, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select(LIST_SELECT)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(limitNum);

    if (error) {
      console.error("[Blogs] getFeaturedBlogs error:", error.message);
      return fail(res, "Failed to fetch featured blogs.", 500);
    }

    return ok(res, { data: data || [] });
  } catch (err) {
    console.error("[Blogs] getFeaturedBlogs exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Get all distinct tags (for filter UI)
// @route   GET /api/blogs/tags
// @access  Public
// =============================================================================
export const getAllTags = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("tags");

    if (error) {
      console.error("[Blogs] getAllTags error:", error.message);
      return fail(res, "Failed to fetch tags.", 500);
    }

    const allTags = [
      ...new Set((data || []).flatMap((b) => b.tags || [])),
    ].sort();

    return ok(res, { data: allTags });
  } catch (err) {
    console.error("[Blogs] getAllTags exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// ADMIN CONTROLLERS
// =============================================================================

// =============================================================================
// @desc    Admin dashboard stats
// @route   GET /api/blogs/admin/stats
// @access  Private + Admin
// =============================================================================
export const getBlogStats = async (req, res) => {
  try {
    const [totalRes, featuredRes, thisMonthRes] = await Promise.all([
      supabaseAdmin
        .from(TABLES.BLOGS)
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from(TABLES.BLOGS)
        .select("id", { count: "exact", head: true })
        .eq("featured", true),

      supabaseAdmin
        .from(TABLES.BLOGS)
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ).toISOString(),
        ),
    ]);

    return ok(res, {
      data: {
        total: totalRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        thisMonth: thisMonthRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error("[Blogs] getBlogStats exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — get all blogs with full content + filters
// @route   GET /api/blogs/admin
// @access  Private + Admin
// =============================================================================
// export const getAllBlogsAdmin = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search,
//       tag,
//       featured,
//       sort = "created_at",
//       order = "desc",
//     } = req.query;

//     const pageNum = Math.max(1, parseInt(page, 10));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
//     const offset = (pageNum - 1) * limitNum;

//     const allowedSorts = ["created_at", "updated_at", "title"];
//     const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
//     const ascending = order === "asc";

//     let query = supabaseAdmin
//       .from(TABLES.BLOGS)
//       .select(FULL_SELECT, { count: "exact" })
//       .order(sortCol, { ascending })
//       .range(offset, offset + limitNum - 1);

//     if (featured === "true") query = query.eq("featured", true);
//     if (featured === "false") query = query.eq("featured", false);
//     if (tag?.trim()) query = query.contains("tags", [tag.trim()]);
//     if (search?.trim()) {
//       query = query.or(
//         `title.ilike.%${search.trim()}%,excerpt.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`,
//       );
//     }

//     const { data, error, count } = await query;

//     if (error) {
//       console.error("[Blogs] getAllBlogsAdmin error:", error.message);
//       return fail(res, "Failed to fetch blogs.", 500);
//     }

//     return ok(res, {
//       data: data || [],
//       pagination: buildPagination(pageNum, limitNum, count ?? 0),
//     });
//   } catch (err) {
//     console.error("[Blogs] getAllBlogsAdmin exception:", err.message);
//     return fail(res, "Server error.", 500);
//   }
// };

export const getAllBlogsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const FULL_SELECT = `
      id,
      title,
      content,
      tags,
      author_id,
      created_at,
      updated_at,
      excerpt,
      image_url,
      featured
    `;

    const { data, error, count } = await supabaseAdmin
      .from("blogs") // must match your table
      .select(FULL_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[Blogs] getAllBlogsAdmin DB error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch blogs.",
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        total: count ?? data.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count ?? data.length) / limitNum),
        hasNextPage: to + 1 < (count ?? 0),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("[Blogs] getAllBlogsAdmin exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
// =============================================================================
// @desc    Admin — create a blog
//          Supports both JSON body (image_url string) AND
//          multipart/form-data (req.file binary image upload)
// @route   POST /api/blogs/admin
// @access  Private + Admin
// =============================================================================
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      tags = [],
      featured = false,
      image_url, // optional: external URL string
    } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!title?.trim()) return fail(res, "Title is required.");
    if (!content?.trim()) return fail(res, "Content is required.");
    if (title.trim().length > 200)
      return fail(res, "Title must be under 200 characters.");

    // Parse tags — frontend may send JSON string or array
    let tagsArr;
    try {
      tagsArr = typeof tags === "string" ? JSON.parse(tags) : tags;
      if (!Array.isArray(tagsArr)) tagsArr = [];
    } catch {
      tagsArr = [];
    }

    // ── Handle image ────────────────────────────────────────────────────────
    // Priority: uploaded file (req.file) > image_url string > null
    let finalImageUrl = image_url?.trim() || null;

    if (req.file) {
      try {
        // Use a temp placeholder ID for the path; we'll update after insert
        const tempId = `temp-${Date.now()}`;
        finalImageUrl = await uploadBlogImageToStorage(req.file, tempId);
      } catch (uploadErr) {
        return fail(res, uploadErr.message, 400);
      }
    }

    // ── Insert ──────────────────────────────────────────────────────────────
    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || generateExcerpt(content),
      tags: tagsArr.map((t) => String(t).trim()).filter(Boolean),
      featured: Boolean(featured === true || featured === "true"),
      image_url: finalImageUrl,
      author_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: blog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .insert(payload)
      .select(FULL_SELECT)
      .single();

    if (error) {
      console.error("[Blogs] createBlog DB error:", error.message);
      return fail(res, "Failed to create blog.", 500);
    }

    console.log(`[Blogs] Created: "${blog.title}" by ${req.user.email}`);

    return ok(res, { message: "Blog created successfully.", data: blog }, 201);
  } catch (err) {
    console.error("[Blogs] createBlog exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — update a blog
//          Supports both JSON body (image_url string) AND
//          multipart/form-data (req.file binary image upload)
// @route   PUT /api/blogs/admin/:id
// @access  Private + Admin
// =============================================================================
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, featured, image_url } = req.body;

    // ── Verify blog exists ──────────────────────────────────────────────────
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, title, image_url")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return fail(res, "Blog not found.", 404);

    // ── Build update payload (only provided fields) ──────────────────────────
    const updates = { updated_at: new Date().toISOString() };

    if (title !== undefined) {
      if (!title.trim()) return fail(res, "Title cannot be empty.");
      if (title.trim().length > 200)
        return fail(res, "Title must be under 200 characters.");
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) return fail(res, "Content cannot be empty.");
      updates.content = content.trim();
      if (excerpt === undefined) {
        updates.excerpt = generateExcerpt(content);
      }
    }

    if (excerpt !== undefined) {
      updates.excerpt = excerpt?.trim() || null;
    }

    if (tags !== undefined) {
      let tagsArr;
      try {
        tagsArr = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(tagsArr)) tagsArr = [];
      } catch {
        tagsArr = [];
      }
      updates.tags = tagsArr.map((t) => String(t).trim()).filter(Boolean);
    }

    if (featured !== undefined) {
      updates.featured = Boolean(featured === true || featured === "true");
    }

    // ── Handle image update ─────────────────────────────────────────────────
    // Priority: uploaded file (req.file) > image_url string > no change
    if (req.file) {
      try {
        const newImageUrl = await uploadBlogImageToStorage(req.file, id);
        // Delete old image from storage after successful upload
        await deleteOldImage(existing.image_url);
        updates.image_url = newImageUrl;
      } catch (uploadErr) {
        return fail(res, uploadErr.message, 400);
      }
    } else if (image_url !== undefined) {
      // Admin explicitly set or cleared the image URL
      updates.image_url = image_url?.trim() || null;
      // If clearing the URL, delete old image from storage
      if (!updates.image_url && existing.image_url) {
        await deleteOldImage(existing.image_url);
      }
    }

    // ── Update DB ───────────────────────────────────────────────────────────
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .update(updates)
      .eq("id", id)
      .select(FULL_SELECT)
      .single();

    if (updateErr) {
      console.error("[Blogs] updateBlog DB error:", updateErr.message);
      return fail(res, "Failed to update blog.", 500);
    }

    console.log(`[Blogs] Updated: "${updated.title}" by ${req.user.email}`);

    return ok(res, { message: "Blog updated successfully.", data: updated });
  } catch (err) {
    console.error("[Blogs] updateBlog exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — permanently delete a blog + its cover image
// @route   DELETE /api/blogs/admin/:id
// @access  Private + Admin
// =============================================================================
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, title, image_url")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return fail(res, "Blog not found.", 404);

    const { error: deleteErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .delete()
      .eq("id", id);

    if (deleteErr) {
      console.error("[Blogs] deleteBlog DB error:", deleteErr.message);
      return fail(res, "Failed to delete blog.", 500);
    }

    // Delete cover image from storage (fire-and-forget)
    await deleteOldImage(existing.image_url);

    console.log(`[Blogs] Deleted: "${existing.title}" by ${req.user.email}`);

    return ok(res, {
      message: `Blog "${existing.title}" deleted successfully.`,
    });
  } catch (err) {
    console.error("[Blogs] deleteBlog exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — bulk delete blogs + their cover images
// @route   DELETE /api/blogs/admin/bulk
// @access  Private + Admin
// Body: { ids: ["uuid1", "uuid2", ...] }
// =============================================================================
export const bulkDeleteBlogs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return fail(res, "ids must be a non-empty array of UUIDs.");
    }
    if (ids.length > 50) {
      return fail(res, "Cannot delete more than 50 blogs at once.");
    }

    // Fetch image URLs before delete for storage cleanup
    const { data: blogs } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, image_url")
      .in("id", ids);

    const { error, count } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      console.error("[Blogs] bulkDeleteBlogs DB error:", error.message);
      return fail(res, "Failed to delete blogs.", 500);
    }

    // Delete all cover images from storage (fire-and-forget)
    const imageUrls = (blogs || []).map((b) => b.image_url).filter(Boolean);

    if (imageUrls.length > 0) {
      Promise.allSettled(imageUrls.map((url) => deleteOldImage(url)));
    }

    console.log(`[Blogs] Bulk deleted ${count} blogs by ${req.user.email}`);

    return ok(res, {
      message: `${count} blog(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error("[Blogs] bulkDeleteBlogs exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — toggle featured flag on a blog
// @route   PUT /api/blogs/admin/:id/toggle-featured
// @access  Private + Admin
// =============================================================================
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, title, featured")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return fail(res, "Blog not found.", 404);

    const newFeatured = !existing.featured;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .update({ featured: newFeatured, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, featured, updated_at")
      .single();

    if (updateErr) {
      console.error("[Blogs] toggleFeatured DB error:", updateErr.message);
      return fail(res, "Failed to update featured status.", 500);
    }

    return ok(res, {
      message: `Blog "${existing.title}" is now ${newFeatured ? "featured" : "unfeatured"}.`,
      data: updated,
    });
  } catch (err) {
    console.error("[Blogs] toggleFeatured exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// =============================================================================
// @desc    Admin — upload / replace blog cover image
// @route   POST /api/blogs/admin/:id/image
// @access  Private + Admin
// Content-Type: multipart/form-data  field name: "image"
// =============================================================================
export const uploadBlogImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) return fail(res, "No image file provided.");

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, title, image_url")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return fail(res, "Blog not found.", 404);

    // Upload new image (throws on invalid type / size)
    let publicUrl;
    try {
      publicUrl = await uploadBlogImageToStorage(req.file, id);
    } catch (uploadErr) {
      return fail(res, uploadErr.message, 400);
    }

    // Update DB
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, image_url, updated_at")
      .single();

    if (updateErr) {
      console.error("[Blogs] uploadBlogImage DB error:", updateErr.message);
      return fail(res, "Failed to save image URL.", 500);
    }

    // Delete old image from storage after successful DB update
    await deleteOldImage(existing.image_url);

    console.log(`[Blogs] Cover image uploaded for "${existing.title}"`);

    return ok(res, {
      message: "Blog cover image uploaded successfully.",
      image_url: publicUrl,
      data: updated,
    });
  } catch (err) {
    console.error("[Blogs] uploadBlogImage exception:", err.message);
    return fail(res, "Failed to upload image.", 500);
  }
};

// =============================================================================
// @desc    Admin — remove blog cover image
// @route   DELETE /api/blogs/admin/:id/image
// @access  Private + Admin
// =============================================================================
export const deleteBlogImage = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("id, title, image_url")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) return fail(res, "Blog not found.", 404);
    if (!existing.image_url)
      return fail(res, "This blog has no cover image.", 400);

    // Delete from storage
    await deleteOldImage(existing.image_url);

    // Clear from DB
    await supabaseAdmin
      .from(TABLES.BLOGS)
      .update({ image_url: null, updated_at: new Date().toISOString() })
      .eq("id", id);

    return ok(res, { message: "Blog cover image removed successfully." });
  } catch (err) {
    console.error("[Blogs] deleteBlogImage exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};
