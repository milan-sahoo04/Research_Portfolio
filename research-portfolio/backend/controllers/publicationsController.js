const { validationResult } = require("express-validator");
const {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
  getSignedUrl,
} = require("../config/supabaseClient");

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const parseArrayParam = (param) => {
  if (!param) return null;
  if (Array.isArray(param)) return param;
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch {
    return field
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

// =============================================================================
// @desc    Get all publications — search, filter, paginate
// @route   GET /api/publications
// @access  Public
// =============================================================================
exports.getPublications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      year,
      year_from,
      year_to,
      type,
      status,
      keyword,
      author,
      journal,
      featured,
      sort = "year",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = ["year", "title", "citations", "created_at"];
    const sortCol = allowedSorts.includes(sort) ? sort : "year";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, year, journal, conference, volume, issue,
         pages, abstract, keywords, pdf_url, doi, external_url,
         status, type, citations, featured, created_at, user_id`,
        { count: "exact" },
      )
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    // ── Filters ──────────────────────────────────────────────────────────────
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,abstract.ilike.%${search}%,journal.ilike.%${search}%`,
      );
    }

    if (keyword) {
      query = query.contains("keywords", [keyword.toLowerCase().trim()]);
    }

    if (author) {
      query = query.contains("authors", [author.trim()]);
    }

    if (journal) {
      query = query.ilike("journal", `%${journal}%`);
    }

    if (year) {
      query = query.eq("year", parseInt(year, 10));
    } else {
      if (year_from) query = query.gte("year", parseInt(year_from, 10));
      if (year_to) query = query.lte("year", parseInt(year_to, 10));
    }

    if (type) {
      const types = parseArrayParam(type);
      if (types?.length) query = query.in("type", types);
    }

    if (status) {
      const statuses = parseArrayParam(status);
      if (statuses?.length) query = query.in("status", statuses);
    }

    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error("getPublications error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch publications." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("getPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single publication by ID
// @route   GET /api/publications/:id
// @access  Public
// =============================================================================
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: publication, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    // Generate signed URL for private PDFs
    if (publication.pdf_url && !publication.pdf_url.startsWith("http")) {
      try {
        publication.pdf_url = await getSignedUrl(
          STORAGE_BUCKETS.PUBLICATION_PDFS,
          publication.pdf_url,
          3600,
        );
      } catch {
        publication.pdf_url = null;
      }
    }

    // Increment citation view count (fire and forget)
    supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({ views: (publication.views || 0) + 1 })
      .eq("id", id)
      .then(() => {})
      .catch(() => {});

    return res.status(200).json({ success: true, data: publication });
  } catch (err) {
    console.error("getPublicationById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get featured publications (for homepage / highlights)
// @route   GET /api/publications/featured
// @access  Public
// =============================================================================
exports.getFeaturedPublications = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10)));

    const { data, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, year, journal, conference,
         abstract, keywords, pdf_url, doi, status, type, citations, featured`,
      )
      .eq("featured", true)
      .eq("status", "published")
      .order("year", { ascending: false })
      .limit(limitNum);

    if (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch featured publications.",
        });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getFeaturedPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct metadata for filter UI (years, types, keywords, journals)
// @route   GET /api/publications/meta
// @access  Public
// =============================================================================
exports.getPublicationMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("year, type, status, keywords, journal, conference");

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch metadata." });
    }

    const years = [...new Set(data.map((p) => p.year).filter(Boolean))].sort(
      (a, b) => b - a,
    );
    const types = [...new Set(data.map((p) => p.type).filter(Boolean))].sort();
    const statuses = [
      ...new Set(data.map((p) => p.status).filter(Boolean)),
    ].sort();
    const journals = [
      ...new Set(data.map((p) => p.journal).filter(Boolean)),
    ].sort();
    const keywords = [...new Set(data.flatMap((p) => p.keywords || []))].sort();

    return res.status(200).json({
      success: true,
      data: { years, types, statuses, journals, keywords },
    });
  } catch (err) {
    console.error("getPublicationMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get my publications (authenticated user)
// @route   GET /api/publications/my
// @access  Private
// =============================================================================
exports.getMyPublications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, year } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order("year", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", parseInt(year, 10));

    const { data, error, count } = await query;

    if (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch your publications.",
        });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("getMyPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Create a publication
// @route   POST /api/publications
// @access  Private
// =============================================================================
exports.createPublication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const {
      title,
      authors,
      year,
      journal,
      conference,
      volume,
      issue,
      pages,
      abstract,
      keywords,
      doi,
      external_url,
      status = "published",
      type = "journal",
      citations = 0,
      featured = false,
    } = req.body;

    // ── Handle PDF upload ──────────────────────────────────────────────────
    let pdf_url = req.body.pdf_url || null;
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const safeName = req.file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      const fileName = `publications/${req.user.id}/${Date.now()}_${safeName}`;

      const { publicUrl, error: uploadError } = await uploadFile(
        STORAGE_BUCKETS.PUBLICATION_PDFS,
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );

      if (uploadError) {
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
      pdf_url = publicUrl;
    }

    const authorsArr = parseArrayField(authors);
    const keywordsArr = parseArrayField(keywords).map((k) =>
      k.toLowerCase().trim(),
    );

    const { data: publication, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .insert([
        cleanObject({
          title: title.trim(),
          authors: authorsArr,
          year: parseInt(year, 10),
          journal: journal?.trim() || null,
          conference: conference?.trim() || null,
          volume: volume?.trim() || null,
          issue: issue?.trim() || null,
          pages: pages?.trim() || null,
          abstract: abstract?.trim() || null,
          keywords: keywordsArr,
          pdf_url,
          doi: doi?.trim() || null,
          external_url: external_url?.trim() || null,
          status,
          type,
          citations: parseInt(citations, 10) || 0,
          featured: Boolean(featured),
          user_id: req.user.id,
          views: 0,
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error("createPublication DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create publication." });
    }

    return res.status(201).json({
      success: true,
      message: "Publication created successfully.",
      data: publication,
    });
  } catch (err) {
    console.error("createPublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Update a publication
// @route   PUT /api/publications/:id
// @access  Private (owner or admin)
// =============================================================================
exports.updatePublication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const { id } = req.params;

    // ── Ownership check ────────────────────────────────────────────────────
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, user_id, pdf_url")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    const isOwner = existing.user_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own publications.",
      });
    }

    const {
      title,
      authors,
      year,
      journal,
      conference,
      volume,
      issue,
      pages,
      abstract,
      keywords,
      doi,
      external_url,
      status,
      type,
      citations,
      featured,
    } = req.body;

    // ── Handle new PDF upload ──────────────────────────────────────────────
    let pdf_url = req.body.pdf_url;
    if (req.file) {
      // Delete old PDF from storage
      if (existing.pdf_url && !existing.pdf_url.startsWith("http")) {
        await deleteFile(
          STORAGE_BUCKETS.PUBLICATION_PDFS,
          existing.pdf_url,
        ).catch(() => {});
      }

      const safeName = req.file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      const fileName = `publications/${req.user.id}/${Date.now()}_${safeName}`;

      const { publicUrl, error: uploadError } = await uploadFile(
        STORAGE_BUCKETS.PUBLICATION_PDFS,
        fileName,
        req.file.buffer,
        req.file.mimetype,
      );

      if (uploadError) {
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
      pdf_url = publicUrl;
    }

    const authorsArr = authors ? parseArrayField(authors) : undefined;
    const keywordsArr = keywords
      ? parseArrayField(keywords).map((k) => k.toLowerCase().trim())
      : undefined;

    const updates = cleanObject({
      title: title?.trim(),
      authors: authorsArr,
      year: year ? parseInt(year, 10) : undefined,
      journal: journal?.trim() || null,
      conference: conference?.trim() || null,
      volume: volume?.trim() || null,
      issue: issue?.trim() || null,
      pages: pages?.trim() || null,
      abstract: abstract?.trim() || null,
      keywords: keywordsArr,
      pdf_url,
      doi: doi?.trim() || null,
      external_url: external_url?.trim() || null,
      status,
      type,
      citations: citations !== undefined ? parseInt(citations, 10) : undefined,
      featured: featured !== undefined ? Boolean(featured) : undefined,
      updated_at: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("updatePublication DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update publication." });
    }

    return res.status(200).json({
      success: true,
      message: "Publication updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("updatePublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Delete a publication
// @route   DELETE /api/publications/:id
// @access  Private (owner or admin)
// =============================================================================
exports.deletePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: publication, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, user_id, pdf_url")
      .eq("id", id)
      .single();

    if (fetchError || !publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    const isOwner = publication.user_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own publications.",
      });
    }

    // Delete PDF from Supabase Storage
    if (publication.pdf_url && !publication.pdf_url.startsWith("http")) {
      await deleteFile(
        STORAGE_BUCKETS.PUBLICATION_PDFS,
        publication.pdf_url,
      ).catch(() => {});
    }

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("deletePublication DB error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete publication." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Publication deleted successfully." });
  } catch (err) {
    console.error("deletePublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Upload / replace PDF for a publication
// @route   POST /api/publications/:id/pdf
// @access  Private (owner or admin)
// =============================================================================
exports.uploadPublicationPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No PDF file provided." });
    }

    const { id } = req.params;

    const { data: publication, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, user_id, pdf_url")
      .eq("id", id)
      .single();

    if (fetchError || !publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    const isOwner = publication.user_id === req.user.id;
    const isAdmin = ["admin", "superadmin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied." });
    }

    // Delete old PDF
    if (publication.pdf_url && !publication.pdf_url.startsWith("http")) {
      await deleteFile(
        STORAGE_BUCKETS.PUBLICATION_PDFS,
        publication.pdf_url,
      ).catch(() => {});
    }

    const safeName = req.file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const fileName = `publications/${req.user.id}/${Date.now()}_${safeName}`;

    const { publicUrl, error: uploadError } = await uploadFile(
      STORAGE_BUCKETS.PUBLICATION_PDFS,
      fileName,
      req.file.buffer,
      req.file.mimetype,
    );

    if (uploadError) {
      return res
        .status(500)
        .json({ success: false, message: "PDF upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "PDF uploaded successfully.",
      data: { pdf_url: publicUrl },
    });
  } catch (err) {
    console.error("uploadPublicationPDF exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Toggle featured flag
// @route   PATCH /api/publications/:id/featured
// @access  Private + Admin
// =============================================================================
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pub, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, featured")
      .eq("id", id)
      .single();

    if (fetchError || !pub) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({ featured: !pub.featured, updated_at: new Date().toISOString() })
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
      message: `Publication ${updated.featured ? "featured" : "unfeatured"} successfully.`,
      data: updated,
    });
  } catch (err) {
    console.error("toggleFeatured exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Update citation count
// @route   PATCH /api/publications/:id/citations
// @access  Private + Admin
// =============================================================================
exports.updateCitations = async (req, res) => {
  try {
    const { id } = req.params;
    const { citations } = req.body;

    if (citations === undefined || isNaN(parseInt(citations, 10))) {
      return res
        .status(400)
        .json({ success: false, message: "Valid citation count is required." });
    }

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({
        citations: Math.max(0, parseInt(citations, 10)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, citations")
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to update citations." });
    }

    return res.status(200).json({
      success: true,
      message: "Citations updated.",
      data: updated,
    });
  } catch (err) {
    console.error("updateCitations exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get publication statistics (admin dashboard)
// @route   GET /api/publications/admin/stats
// @access  Private + Admin
// =============================================================================
exports.getPublicationStats = async (req, res) => {
  try {
    const [totalRes, typeRes, statusRes, featuredRes, citationsRes, yearRes] =
      await Promise.all([
        supabaseAdmin
          .from(TABLES.PUBLICATIONS)
          .select("id", { count: "exact", head: true }),

        supabaseAdmin.from(TABLES.PUBLICATIONS).select("type"),

        supabaseAdmin.from(TABLES.PUBLICATIONS).select("status"),

        supabaseAdmin
          .from(TABLES.PUBLICATIONS)
          .select("id", { count: "exact", head: true })
          .eq("featured", true),

        supabaseAdmin.from(TABLES.PUBLICATIONS).select("citations"),

        supabaseAdmin
          .from(TABLES.PUBLICATIONS)
          .select("year")
          .order("year", { ascending: false })
          .limit(1),
      ]);

    const byType = (typeRes.data || []).reduce((acc, { type }) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const byStatus = (statusRes.data || []).reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalCitations = (citationsRes.data || []).reduce(
      (sum, { citations }) => sum + (citations || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        totalCitations,
        latestYear: yearRes.data?.[0]?.year ?? null,
        byType,
        byStatus,
      },
    });
  } catch (err) {
    console.error("getPublicationStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get ALL publications with owner info
// @route   GET /api/publications/admin/all
// @access  Private + Admin
// =============================================================================
exports.adminGetAllPublications = async (req, res) => {
  try {
    const { page = 1, limit = 15, search, type, status, year } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, year, type, status, featured,
         citations, views, created_at, updated_at, user_id,
         owner:users(id, name, email)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (year) query = query.eq("year", parseInt(year, 10));

    const { data, error, count } = await query;

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch publications." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("adminGetAllPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
