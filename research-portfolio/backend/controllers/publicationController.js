/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/publicationController.js
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
// FINAL DATABASE SCHEMA (publications table)
// ─────────────────────────────────────────────
// id           uuid  PK
// title        text
// authors      text[]
// abstract     text
// keywords     text[]
// journal_name text
// date         date        (e.g. "2024-03-15")
// doi          text
// pdf_url      text
// featured     boolean
// created_at   timestamptz
// updated_at   timestamptz
// created_by   uuid  FK → users.id
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

// ─────────────────────────────────────────────
// SHARED PDF UPLOAD HELPER
// Your supabaseClient.uploadFile() returns publicUrl directly (throws on error)
// Wrap in try/catch at call sites
// ─────────────────────────────────────────────
const handlePDFUpload = async (file, userId) => {
  const safeName = file.originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const fileName = `publications/${userId}/${Date.now()}_${safeName}`;

  // uploadFile() in your supabaseClient throws on error, returns publicUrl string
  const publicUrl = await uploadFile(
    STORAGE_BUCKETS.PUBLICATION_PDFS,
    fileName,
    file.buffer,
    file.mimetype,
  );

  return publicUrl;
};

// ─────────────────────────────────────────────
// SHARED PDF DELETE HELPER
// Only deletes if it's a Supabase storage path, not an external URL
// ─────────────────────────────────────────────
const handlePDFDelete = async (pdfUrl) => {
  if (!pdfUrl || pdfUrl.startsWith("http")) return;
  await deleteFile(STORAGE_BUCKETS.PUBLICATION_PDFS, pdfUrl).catch(() => {});
};

// =============================================================================
// PUBLIC CONTROLLERS
// =============================================================================

// =============================================================================
// @desc    Get all publications — search, filter, paginate
// @route   GET /api/publications
// @access  Public
// =============================================================================
export const getPublications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      keyword,
      author,
      journal,
      featured,
      date_from,
      date_to,
      sort = "date",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = ["date", "title", "created_at"];
    const sortCol = allowedSorts.includes(sort) ? sort : "date";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, abstract, keywords,
         journal_name, date, doi, pdf_url, featured, created_at`,
        { count: "exact" },
      )
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,abstract.ilike.%${search}%,journal_name.ilike.%${search}%`,
      );
    }
    if (keyword)
      query = query.contains("keywords", [keyword.toLowerCase().trim()]);
    if (author) query = query.contains("authors", [author.trim()]);
    if (journal) query = query.ilike("journal_name", `%${journal}%`);
    if (date_from) query = query.gte("date", date_from);
    if (date_to) query = query.lte("date", date_to);
    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Publications] getPublications error:", error.message);
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
    console.error("[Publications] getPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single publication by ID
// @route   GET /api/publications/:id
// @access  Public
// =============================================================================
export const getPublicationById = async (req, res) => {
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

    // Strip pdf_url from public response — require login to download
    // pdf_url is only exposed via the /download route below
    const { pdf_url, ...publicData } = publication;
    const hasPDF = Boolean(pdf_url);

    return res.status(200).json({
      success: true,
      data: { ...publicData, has_pdf: hasPDF },
    });
  } catch (err) {
    console.error("[Publications] getPublicationById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get featured publications (homepage highlights)
// @route   GET /api/publications/featured
// @access  Public
// =============================================================================
export const getFeaturedPublications = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10)));

    const { data, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, abstract, keywords,
         journal_name, date, doi, featured`,
      )
      .eq("featured", true)
      .order("date", { ascending: false })
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
    console.error(
      "[Publications] getFeaturedPublications exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Full-text search across title, abstract, journal_name
// @route   GET /api/publications/search?q=<query>
// @access  Public
// =============================================================================
export const searchPublications = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Search query (q) is required." });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, abstract, keywords,
         journal_name, date, doi, featured`,
        { count: "exact" },
      )
      .or(`title.ilike.%${q}%,abstract.ilike.%${q}%,journal_name.ilike.%${q}%`)
      .order("date", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error("[Publications] searchPublications error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Search failed." });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Publications] searchPublications exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct filter options (years, journals, keywords)
// @route   GET /api/publications/meta
// @access  Public
// =============================================================================
export const getPublicationMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("date, keywords, journal_name");

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch metadata." });
    }

    const years = [
      ...new Set(
        data
          .map((p) => p.date && new Date(p.date).getFullYear())
          .filter(Boolean),
      ),
    ].sort((a, b) => b - a);

    const journals = [
      ...new Set(data.map((p) => p.journal_name).filter(Boolean)),
    ].sort();
    const keywords = [...new Set(data.flatMap((p) => p.keywords || []))].sort();

    return res.status(200).json({
      success: true,
      data: { years, journals, keywords },
    });
  } catch (err) {
    console.error("[Publications] getPublicationMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// PROTECTED — LOGGED-IN USERS
// =============================================================================

// =============================================================================
// @desc    Secure PDF download — generates a 60-min signed URL
// @route   GET /api/publications/:id/download
// @access  Private (protect + requireVerified)
// =============================================================================
export const downloadPublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: publication, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, title, pdf_url")
      .eq("id", id)
      .single();

    if (error || !publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    if (!publication.pdf_url) {
      return res.status(404).json({
        success: false,
        message: "No PDF available for this publication.",
      });
    }

    let downloadUrl;

    if (publication.pdf_url.startsWith("http")) {
      // Already a public URL (e.g. external DOI link or public bucket)
      downloadUrl = publication.pdf_url;
    } else {
      // Supabase Storage path → generate 60-min signed URL
      try {
        downloadUrl = await getSignedUrl(
          STORAGE_BUCKETS.PUBLICATION_PDFS,
          publication.pdf_url,
          3600, // 60 minutes
        );
      } catch (signedErr) {
        console.error(
          "[Publications] downloadPublication signed URL error:",
          signedErr.message,
        );
        return res.status(500).json({
          success: false,
          message: "Failed to generate download link. Please try again.",
        });
      }
    }

    // Log download (fire-and-forget — never blocks the response)
    supabaseAdmin
      .from("publication_downloads")
      .insert({
        publication_id: id,
        user_id: req.user.id,
        downloaded_at: new Date().toISOString(),
      })
      .then(() => {})
      .catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Download link generated. Valid for 60 minutes.",
      data: {
        download_url: downloadUrl,
        title: publication.title,
        expires_in: 3600,
      },
    });
  } catch (err) {
    console.error("[Publications] downloadPublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// ADMIN CONTROLLERS
// =============================================================================

// =============================================================================
// @desc    Admin — create a publication
// @route   POST /api/publications/admin
// @access  Private + Admin
// =============================================================================
export const createPublication = async (req, res) => {
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
      abstract,
      keywords,
      journal_name,
      date,
      doi,
      featured = false,
    } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required." });
    }

    // ── PDF upload ───────────────────────────────────────────────────────────
    let pdf_url = req.body.pdf_url || null;

    if (req.file) {
      try {
        pdf_url = await handlePDFUpload(req.file, req.user.id);
      } catch (uploadErr) {
        console.error(
          "[Publications] createPublication upload error:",
          uploadErr.message,
        );
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
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
          abstract: abstract?.trim() || null,
          keywords: keywordsArr,
          journal_name: journal_name?.trim() || null,
          date: date || null,
          doi: doi?.trim() || null,
          pdf_url,
          featured: Boolean(featured),
          created_by: req.user.id,
          created_at: new Date().toISOString(),
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "[Publications] createPublication DB error:",
        error.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to create publication." });
    }

    console.log(
      `[Publications] Created: "${publication.title}" by ${req.user.email}`,
    );

    return res.status(201).json({
      success: true,
      message: "Publication created successfully.",
      data: publication,
    });
  } catch (err) {
    console.error("[Publications] createPublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — update a publication
// @route   PUT /api/publications/admin/:id
// @access  Private + Admin
// =============================================================================
export const updatePublication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, pdf_url, title")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    const {
      title,
      authors,
      abstract,
      keywords,
      journal_name,
      date,
      doi,
      featured,
    } = req.body;

    // ── PDF upload (replaces old one) ────────────────────────────────────────
    let pdf_url = req.body.pdf_url; // undefined = no change

    if (req.file) {
      // Delete old PDF from storage
      await handlePDFDelete(existing.pdf_url);

      try {
        pdf_url = await handlePDFUpload(req.file, req.user.id);
      } catch (uploadErr) {
        console.error(
          "[Publications] updatePublication upload error:",
          uploadErr.message,
        );
        return res
          .status(500)
          .json({ success: false, message: "PDF upload failed." });
      }
    }

    const authorsArr = authors ? parseArrayField(authors) : undefined;
    const keywordsArr = keywords
      ? parseArrayField(keywords).map((k) => k.toLowerCase().trim())
      : undefined;

    const updates = cleanObject({
      title: title?.trim(),
      authors: authorsArr,
      abstract: abstract?.trim() || null,
      keywords: keywordsArr,
      journal_name: journal_name?.trim() || null,
      date: date || null,
      doi: doi?.trim() || null,
      pdf_url,
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
      console.error(
        "[Publications] updatePublication DB error:",
        updateError.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to update publication." });
    }

    console.log(
      `[Publications] Updated: "${updated.title}" by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: "Publication updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[Publications] updatePublication exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — permanently delete a publication + its PDF
// @route   DELETE /api/publications/admin/:id
// @access  Private + Admin
// =============================================================================
export const adminDeletePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: publication, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, pdf_url, title")
      .eq("id", id)
      .single();

    if (fetchError || !publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    // Delete PDF from Supabase Storage
    await handlePDFDelete(publication.pdf_url);

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "[Publications] adminDeletePublication DB error:",
        deleteError.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete publication." });
    }

    console.log(
      `[Publications] Deleted: "${publication.title}" (id: ${id}) by ${req.user.email}`,
    );

    return res
      .status(200)
      .json({ success: true, message: "Publication permanently deleted." });
  } catch (err) {
    console.error(
      "[Publications] adminDeletePublication exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — mark a publication as featured
// @route   PATCH /api/publications/admin/:id/feature
// @access  Private + Admin
// =============================================================================
export const adminFeaturePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pub, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, featured, title")
      .eq("id", id)
      .single();

    if (fetchError || !pub) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    if (pub.featured) {
      return res
        .status(400)
        .json({ success: false, message: "Publication is already featured." });
    }

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({ featured: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, featured, title")
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to feature publication." });
    }

    return res.status(200).json({
      success: true,
      message: "Publication featured successfully.",
      data: updated,
    });
  } catch (err) {
    console.error(
      "[Publications] adminFeaturePublication exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — remove featured flag
// @route   PATCH /api/publications/admin/:id/unfeature
// @access  Private + Admin
// =============================================================================
export const adminUnfeaturePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: pub, error: fetchError } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("id, featured, title")
      .eq("id", id)
      .single();

    if (fetchError || !pub) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found." });
    }

    if (!pub.featured) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Publication is already unfeatured.",
        });
    }

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .update({ featured: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, featured, title")
      .single();

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to unfeature publication." });
    }

    return res.status(200).json({
      success: true,
      message: "Publication unfeatured successfully.",
      data: updated,
    });
  } catch (err) {
    console.error(
      "[Publications] adminUnfeaturePublication exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — list all publications with filters (manage page)
// @route   GET /api/publications/admin/manage-publications
// @access  Private + Admin
// =============================================================================
export const adminManagePublications = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, year, featured } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select(
        `id, title, authors, journal_name, date, doi,
         pdf_url, featured, created_at, updated_at`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search)
      query = query.or(
        `title.ilike.%${search}%,journal_name.ilike.%${search}%`,
      );
    if (year)
      query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error(
        "[Publications] adminManagePublications error:",
        error.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch publications." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error(
      "[Publications] adminManagePublications exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get ALL publications (full rows, for data export / bulk ops)
// @route   GET /api/publications/admin/all
// @access  Private + Admin
// =============================================================================
export const adminGetAllPublications = async (req, res) => {
  try {
    const { page = 1, limit = 15, search, year, featured } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.PUBLICATIONS)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (year)
      query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error(
        "[Publications] adminGetAllPublications error:",
        error.message,
      );
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch publications." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error(
      "[Publications] adminGetAllPublications exception:",
      err.message,
    );
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — dashboard stats
// @route   GET /api/publications/admin/stats
// @access  Private + Admin
// =============================================================================
export const getPublicationStats = async (req, res) => {
  try {
    const [totalRes, featuredRes, latestRes] = await Promise.all([
      supabaseAdmin
        .from(TABLES.PUBLICATIONS)
        .select("id", { count: "exact", head: true }),

      supabaseAdmin
        .from(TABLES.PUBLICATIONS)
        .select("id", { count: "exact", head: true })
        .eq("featured", true),

      supabaseAdmin
        .from(TABLES.PUBLICATIONS)
        .select("date")
        .order("date", { ascending: false })
        .limit(1),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        latestDate: latestRes.data?.[0]?.date ?? null,
      },
    });
  } catch (err) {
    console.error("[Publications] getPublicationStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
