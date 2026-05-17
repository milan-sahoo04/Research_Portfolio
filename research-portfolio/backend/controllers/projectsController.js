const { validationResult } = require("express-validator");
const {
  supabase,
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
  getSignedUrl,
} = require("../config/supabaseClient");

// ─── Helper: format validation errors ────────────────────────────────────────
const formatErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

// ─── Helper: build pagination meta ───────────────────────────────────────────
const buildPagination = (page, limit, total) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

// ─── Helper: parse comma-separated query params ───────────────────────────────
const parseArrayParam = (param) => {
  if (!param) return null;
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ─── Helper: strip undefined keys from object ─────────────────────────────────
const cleanObject = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

// =============================================================================
// @desc    Get all projects (public) with search, filter, pagination
// @route   GET /api/projects
// @access  Public
// =============================================================================
exports.getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      search,
      category,
      status,
      tech,
      featured,
      sort = "created_at",
      order = "desc",
      visibility = "public",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Allowed sort columns to prevent injection
    const allowedSorts = ["created_at", "title", "start_date", "views"];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    // ── Base query ──
    let query = supabaseAdmin
      .from(TABLES.PROJECTS)
      .select(
        `id, title, short_description, description, category, tech_stack,
         status, image_url, github_url, demo_url, paper_url,
         featured, views, start_date, end_date, created_at, owner_id,
         collaborators:team_members(id, name, role, photo_url)`,
        { count: "exact" },
      )
      .eq("visibility", visibility)
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    // ── Filters ──
    if (category) {
      const cats = parseArrayParam(category);
      if (cats?.length) query = query.in("category", cats);
    }

    if (status) {
      const statuses = parseArrayParam(status);
      if (statuses?.length) query = query.in("status", statuses);
    }

    if (featured === "true") query = query.eq("featured", true);

    // Tech stack filter (checks if array contains value)
    if (tech) {
      const techList = parseArrayParam(tech);
      if (techList?.length) {
        query = query.overlaps("tech_stack", techList);
      }
    }

    // Full-text search on title + description
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,short_description.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("getProjects error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch projects." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("getProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
// =============================================================================
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select(
        `*, collaborators:team_members(id, name, role, photo_url, linkedin_url, github_url)`,
      )
      .eq("id", id)
      .single();

    if (error || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Increment view count (fire-and-forget — don't await)
    supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({ views: (project.views || 0) + 1 })
      .eq("id", id)
      .then(() => {})
      .catch(() => {});

    // Generate signed URL for private files if needed
    if (project.file_url && !project.file_url.startsWith("http")) {
      try {
        project.file_url = await getSignedUrl(
          STORAGE_BUCKETS.PROJECT_FILES,
          project.file_url,
        );
      } catch {
        project.file_url = null;
      }
    }

    return res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error("getProjectById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get MY projects (authenticated user's own projects)
// @route   GET /api/projects/my
// @access  Private
// =============================================================================
exports.getMyProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("*", { count: "exact" })
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch your projects." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("getMyProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
// =============================================================================
exports.createProject = async (req, res) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const {
      title,
      description,
      short_description,
      category,
      tech_stack,
      github_url,
      demo_url,
      paper_url,
      status = "ongoing",
      visibility = "public",
      featured = false,
      start_date,
      end_date,
      collaborator_ids,
    } = req.body;

    // ── Handle image upload ──
    let image_url = req.body.image_url || null;
    if (req.file) {
      const fileName = `projects/${req.user.id}/${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
      const { publicUrl, error: uploadError } = await uploadFile(
        STORAGE_BUCKETS.PROJECT_FILES,
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );
      if (uploadError) {
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
      image_url = publicUrl;
    }

    // ── Parse tech_stack and collaborator_ids ──
    const techArray = Array.isArray(tech_stack)
      ? tech_stack
      : tech_stack
        ? tech_stack
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const collabIds = Array.isArray(collaborator_ids)
      ? collaborator_ids
      : collaborator_ids
        ? JSON.parse(collaborator_ids)
        : [];

    // ── Insert project ──
    const { data: project, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .insert([
        cleanObject({
          title: title.trim(),
          description: description?.trim(),
          short_description: short_description?.trim(),
          category,
          tech_stack: techArray,
          github_url: github_url?.trim() || null,
          demo_url: demo_url?.trim() || null,
          paper_url: paper_url?.trim() || null,
          image_url,
          status,
          visibility,
          featured: Boolean(featured),
          start_date: start_date || null,
          end_date: end_date || null,
          owner_id: req.user.id,
          views: 0,
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error("createProject DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create project." });
    }

    // ── Link collaborators ──
    if (collabIds.length > 0) {
      const links = collabIds.map((team_member_id) => ({
        project_id: project.id,
        team_member_id,
      }));
      await supabaseAdmin.from("project_collaborators").insert(links);
    }

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (err) {
    console.error("createProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (owner or admin)
// =============================================================================
exports.updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const { id } = req.params;

    // ── Verify ownership ──
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, owner_id, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const isOwner = existing.owner_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only update your own projects.",
        });
    }

    const {
      title,
      description,
      short_description,
      category,
      tech_stack,
      github_url,
      demo_url,
      paper_url,
      status,
      visibility,
      featured,
      start_date,
      end_date,
      collaborator_ids,
    } = req.body;

    // ── Handle new image upload ──
    let image_url = req.body.image_url;
    if (req.file) {
      // Delete old image if it's in Supabase Storage
      if (existing.image_url && !existing.image_url.includes("http")) {
        await deleteFile(
          STORAGE_BUCKETS.PROJECT_FILES,
          existing.image_url,
        ).catch(() => {});
      }
      const fileName = `projects/${req.user.id}/${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
      const { publicUrl, error: uploadError } = await uploadFile(
        STORAGE_BUCKETS.PROJECT_FILES,
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );
      if (uploadError) {
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed." });
      }
      image_url = publicUrl;
    }

    // ── Parse tech_stack ──
    const techArray = tech_stack
      ? Array.isArray(tech_stack)
        ? tech_stack
        : tech_stack
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
      : undefined;

    // ── Build update payload (only include defined fields) ──
    const updates = cleanObject({
      title: title?.trim(),
      description: description?.trim(),
      short_description: short_description?.trim(),
      category,
      tech_stack: techArray,
      github_url: github_url?.trim() || null,
      demo_url: demo_url?.trim() || null,
      paper_url: paper_url?.trim() || null,
      image_url,
      status,
      visibility,
      featured: featured !== undefined ? Boolean(featured) : undefined,
      start_date: start_date || null,
      end_date: end_date || null,
      updated_at: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("updateProject DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update project." });
    }

    // ── Update collaborators if provided ──
    if (collaborator_ids !== undefined) {
      const collabIds = Array.isArray(collaborator_ids)
        ? collaborator_ids
        : JSON.parse(collaborator_ids || "[]");

      // Remove existing links and re-insert
      await supabaseAdmin
        .from("project_collaborators")
        .delete()
        .eq("project_id", id);

      if (collabIds.length > 0) {
        const links = collabIds.map((team_member_id) => ({
          project_id: id,
          team_member_id,
        }));
        await supabaseAdmin.from("project_collaborators").insert(links);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("updateProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (owner or admin)
// =============================================================================
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, owner_id, image_url, file_url")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const isOwner = project.owner_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only delete your own projects.",
        });
    }

    // ── Clean up storage files ──
    const deletePromises = [];
    if (project.image_url && !project.image_url.startsWith("http")) {
      deletePromises.push(
        deleteFile(STORAGE_BUCKETS.PROJECT_FILES, project.image_url),
      );
    }
    if (project.file_url && !project.file_url.startsWith("http")) {
      deletePromises.push(
        deleteFile(STORAGE_BUCKETS.PROJECT_FILES, project.file_url),
      );
    }
    await Promise.allSettled(deletePromises);

    // ── Delete collaborator links ──
    await supabaseAdmin
      .from("project_collaborators")
      .delete()
      .eq("project_id", id);

    // ── Delete the project row ──
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("deleteProject DB error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete project." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (err) {
    console.error("deleteProject exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Toggle featured status (admin only)
// @route   PATCH /api/projects/:id/featured
// @access  Private + Admin
// =============================================================================
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, featured")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({
        featured: !project.featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, featured")
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to toggle featured." });
    }

    return res.status(200).json({
      success: true,
      message: `Project ${updated.featured ? "featured" : "unfeatured"} successfully.`,
      data: updated,
    });
  } catch (err) {
    console.error("toggleFeatured exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Toggle visibility (public / private)
// @route   PATCH /api/projects/:id/visibility
// @access  Private (owner or admin)
// =============================================================================
exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, owner_id, visibility")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const isOwner = project.owner_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied." });
    }

    const newVisibility =
      project.visibility === "public" ? "private" : "public";

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({
        visibility: newVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, visibility")
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to toggle visibility." });
    }

    return res.status(200).json({
      success: true,
      message: `Project is now ${updated.visibility}.`,
      data: updated,
    });
  } catch (err) {
    console.error("toggleVisibility exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get project statistics (admin dashboard)
// @route   GET /api/projects/stats
// @access  Private + Admin
// =============================================================================
exports.getProjectStats = async (req, res) => {
  try {
    const [totalRes, categoryRes, statusRes, featuredRes] = await Promise.all([
      // Total count
      supabaseAdmin
        .from(TABLES.PROJECTS)
        .select("id", { count: "exact", head: true }),

      // Count by category
      supabaseAdmin.from(TABLES.PROJECTS).select("category"),

      // Count by status
      supabaseAdmin.from(TABLES.PROJECTS).select("status"),

      // Featured count
      supabaseAdmin
        .from(TABLES.PROJECTS)
        .select("id", { count: "exact", head: true })
        .eq("featured", true),
    ]);

    // Aggregate category counts
    const categoryCounts = (categoryRes.data || []).reduce(
      (acc, { category }) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {},
    );

    // Aggregate status counts
    const statusCounts = (statusRes.data || []).reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        byCategory: categoryCounts,
        byStatus: statusCounts,
      },
    });
  } catch (err) {
    console.error("getProjectStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct categories and tech stacks (for filter UI)
// @route   GET /api/projects/meta
// @access  Public
// =============================================================================
exports.getProjectMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("category, tech_stack, status")
      .eq("visibility", "public");

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
    const techStacks = [
      ...new Set(data.flatMap((p) => p.tech_stack || [])),
    ].sort();

    return res.status(200).json({
      success: true,
      data: { categories, statuses, techStacks },
    });
  } catch (err) {
    console.error("getProjectMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get featured projects only (for homepage)
// @route   GET /api/projects/featured
// @access  Public
// =============================================================================
exports.getFeaturedProjects = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10)));

    const { data, error } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select(
        `id, title, short_description, category, tech_stack,
         image_url, github_url, demo_url, status, featured, created_at`,
      )
      .eq("featured", true)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(limitNum);

    if (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch featured projects.",
        });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getFeaturedProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Upload project image separately
// @route   POST /api/projects/:id/image
// @access  Private (owner or admin)
// =============================================================================
exports.uploadProjectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided." });
    }

    const { id } = req.params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from(TABLES.PROJECTS)
      .select("id, owner_id, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const isOwner = project.owner_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied." });
    }

    // Delete old image
    if (project.image_url && !project.image_url.startsWith("http")) {
      await deleteFile(STORAGE_BUCKETS.PROJECT_FILES, project.image_url).catch(
        () => {},
      );
    }

    const fileName = `projects/${req.user.id}/${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const { publicUrl, error: uploadError } = await uploadFile(
      STORAGE_BUCKETS.PROJECT_FILES,
      fileName,
      req.file.buffer,
      req.file.mimetype,
    );

    if (uploadError) {
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.PROJECTS)
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "Project image uploaded successfully.",
      data: { image_url: publicUrl },
    });
  } catch (err) {
    console.error("uploadProjectImage exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get ALL projects regardless of visibility
// @route   GET /api/projects/admin/all
// @access  Private + Admin
// =============================================================================
exports.adminGetAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search,
      category,
      status,
      visibility,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PROJECTS)
      .select(
        `id, title, category, status, visibility, featured,
         views, created_at, updated_at, owner_id,
         owner:users(id, name, email)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (visibility) query = query.eq("visibility", visibility);

    const { data, error, count } = await query;

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch projects." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("adminGetAllProjects exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
