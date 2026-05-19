/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/teamController.js
// ─────────────────────────────────────────────────────────────────────────────

import { validationResult } from "express-validator";
import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
} from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// SCHEMA COLUMNS
// ─────────────────────────────────────────────
// id                uuid        NOT NULL  PK
// name              text        NOT NULL
// role              text        nullable  (Researcher / Faculty / Student)
// email             text        nullable
// profile_pic       text        nullable
// linked_projects   uuid[]      nullable
// bio               text        nullable
// expertise         text[]      nullable
// socials           jsonb       nullable  { github, linkedin, twitter }
// publications      int         nullable
// citations         int         nullable
// join_year         text        nullable
// featured          bool        nullable
// created_at        timestamptz nullable
// updated_at        timestamptz nullable
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

const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => v.trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed)
      ? parsed.map((v) => v.trim()).filter(Boolean)
      : [];
  } catch {
    return val
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};

const parseSocials = (val) => {
  if (!val) return null;
  if (typeof val === "object" && !Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
};

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
// @desc    Get all team members — search, filter, paginate
// @route   GET /api/team
// @access  Public
// =============================================================================
export const getAllMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      role,
      join_year,
      featured,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = [
      "created_at",
      "name",
      "role",
      "join_year",
      "publications",
      "citations",
    ];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.TEAM)
      .select(
        `id, name, role, email, profile_pic, bio, expertise,
         socials, publications, citations, join_year, featured, created_at`,
        { count: "exact" },
      )
      .order(sortCol, { ascending, nullsFirst: false })
      .range(offset, offset + limitNum - 1);

    if (search?.trim())
      query = query.or(
        `name.ilike.%${search}%,bio.ilike.%${search}%,email.ilike.%${search}%`,
      );
    if (role) query = query.eq("role", role);
    if (join_year) query = query.eq("join_year", join_year);
    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Team] getAllMembers error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch team members." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Team] getAllMembers exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get single member by ID
// @route   GET /api/team/:id
// @access  Public
// =============================================================================
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: member, error } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    console.error("[Team] getMemberById exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get distinct meta values for filter UI
// @route   GET /api/team/meta
// @access  Public
// =============================================================================
export const getTeamMeta = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("role, join_year, expertise");

    if (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch metadata." });
    }

    const roles = [...new Set(data.map((m) => m.role).filter(Boolean))].sort();
    const joinYears = [
      ...new Set(data.map((m) => m.join_year).filter(Boolean)),
    ].sort((a, b) => b - a);
    const expertise = [
      ...new Set(data.flatMap((m) => m.expertise || [])),
    ].sort();

    return res.status(200).json({
      success: true,
      data: { roles, joinYears, expertise },
    });
  } catch (err) {
    console.error("[Team] getTeamMeta exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — create a team member
// @route   POST /api/team/admin
// @access  Private + Admin
// =============================================================================
export const createMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const {
      name,
      role,
      email,
      bio,
      expertise,
      socials,
      publications,
      citations,
      join_year,
      featured,
    } = req.body;

    // ── Profile pic upload ────────────────────────────────────────────────────
    let profile_pic = req.body.profile_pic || null;
    if (req.file) {
      try {
        profile_pic = await handleFileUpload(
          req.file,
          `team/${Date.now()}`,
          STORAGE_BUCKETS.PROFILE_PICS,
        );
      } catch (uploadErr) {
        console.error("[Team] Profile pic upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Profile picture upload failed." });
      }
    }

    const featuredBool =
      featured === true || featured === "true" || featured === "1";

    const { data: member, error } = await supabaseAdmin
      .from(TABLES.TEAM)
      .insert([
        cleanObject({
          name: name.trim(),
          role: role?.trim() || null,
          email: email?.trim() || null,
          profile_pic,
          bio: bio?.trim() || null,
          expertise: parseArray(expertise),
          socials: parseSocials(socials),
          publications: publications ? parseInt(publications, 10) : null,
          citations: citations ? parseInt(citations, 10) : null,
          join_year: join_year ? String(join_year).trim() : null,
          featured: featuredBool,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      ])
      .select()
      .single();

    if (error) {
      console.error("[Team] createMember DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create team member." });
    }

    console.log(`[Team] Created: "${member.name}" by ${req.user.email}`);

    return res.status(201).json({
      success: true,
      message: "Team member created successfully.",
      data: member,
    });
  } catch (err) {
    console.error("[Team] createMember exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — update a team member
// @route   PUT /api/team/admin/:id
// @access  Private + Admin
// =============================================================================
export const updateMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("id, name, profile_pic")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    const {
      name,
      role,
      email,
      bio,
      expertise,
      socials,
      publications,
      citations,
      join_year,
      featured,
    } = req.body;

    // ── Profile pic replacement ───────────────────────────────────────────────
    let profile_pic = undefined;
    if (req.file) {
      await handleFileDeletion(
        existing.profile_pic,
        STORAGE_BUCKETS.PROFILE_PICS,
      );
      try {
        profile_pic = await handleFileUpload(
          req.file,
          `team/${id}`,
          STORAGE_BUCKETS.PROFILE_PICS,
        );
      } catch (uploadErr) {
        console.error("[Team] Profile pic upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "Profile picture upload failed." });
      }
    }

    const featuredBool =
      featured !== undefined
        ? featured === true || featured === "true" || featured === "1"
        : undefined;

    const updates = cleanObject({
      name: name?.trim(),
      role: role?.trim() || null,
      email: email?.trim() || null,
      profile_pic,
      bio: bio?.trim() || null,
      expertise: expertise !== undefined ? parseArray(expertise) : undefined,
      socials: socials !== undefined ? parseSocials(socials) : undefined,
      publications:
        publications !== undefined ? parseInt(publications, 10) : undefined,
      citations: citations !== undefined ? parseInt(citations, 10) : undefined,
      join_year: join_year !== undefined ? String(join_year).trim() : undefined,
      featured: featuredBool,
      updated_at: new Date().toISOString(),
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Team] updateMember DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update team member." });
    }

    console.log(`[Team] Updated: "${updated.name}" by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("[Team] updateMember exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — delete a single member
// @route   DELETE /api/team/admin/:id
// @access  Private + Admin
// =============================================================================
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: member, error: fetchError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("id, name, profile_pic")
      .eq("id", id)
      .single();

    if (fetchError || !member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    await handleFileDeletion(member.profile_pic, STORAGE_BUCKETS.PROFILE_PICS);

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Team] deleteMember DB error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete team member." });
    }

    console.log(
      `[Team] Deleted: "${member.name}" (id: ${id}) by ${req.user.email}`,
    );

    return res
      .status(200)
      .json({ success: true, message: "Team member deleted successfully." });
  } catch (err) {
    console.error("[Team] deleteMember exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — bulk delete members
// @route   DELETE /api/team/admin/bulk
// @access  Private + Admin
// =============================================================================
export const bulkDeleteMembers = async (req, res) => {
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
        message: "Cannot delete more than 50 members at once.",
      });
    }

    const { data: members } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("id, profile_pic")
      .in("id", ids);

    await Promise.allSettled(
      (members || []).map((m) =>
        handleFileDeletion(m.profile_pic, STORAGE_BUCKETS.PROFILE_PICS),
      ),
    );

    const { error, count } = await supabaseAdmin
      .from(TABLES.TEAM)
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      console.error("[Team] bulkDeleteMembers DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete members." });
    }

    console.log(`[Team] Bulk deleted ${count} members by ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: `${count} member(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error("[Team] bulkDeleteMembers exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — toggle featured flag
// @route   PATCH /api/team/admin/:id/featured
// @access  Private + Admin
// =============================================================================
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: member, error: fetchError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("id, name, featured")
      .eq("id", id)
      .single();

    if (fetchError || !member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    const newFeatured = !member.featured;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .update({ featured: newFeatured, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, featured")
      .single();

    if (updateError) {
      console.error("[Team] toggleFeatured DB error:", updateError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update featured status." });
    }

    console.log(
      `[Team] Featured toggled: "${updated.name}" → ${newFeatured} by ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `Member ${newFeatured ? "marked as featured" : "removed from featured"}.`,
      data: updated,
    });
  } catch (err) {
    console.error("[Team] toggleFeatured exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — upload or replace profile picture
// @route   POST /api/team/admin/:id/profile-pic
// @access  Private + Admin
// =============================================================================
export const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided." });
    }

    const { id } = req.params;

    const { data: member, error: fetchError } = await supabaseAdmin
      .from(TABLES.TEAM)
      .select("id, profile_pic")
      .eq("id", id)
      .single();

    if (fetchError || !member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    await handleFileDeletion(member.profile_pic, STORAGE_BUCKETS.PROFILE_PICS);

    let profile_pic;
    try {
      profile_pic = await handleFileUpload(
        req.file,
        `team/${id}`,
        STORAGE_BUCKETS.PROFILE_PICS,
      );
    } catch (uploadErr) {
      console.error("[Team] uploadProfilePic error:", uploadErr.message);
      return res
        .status(500)
        .json({ success: false, message: "Profile picture upload failed." });
    }

    await supabaseAdmin
      .from(TABLES.TEAM)
      .update({ profile_pic, updated_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully.",
      data: { profile_pic },
    });
  } catch (err) {
    console.error("[Team] uploadProfilePic exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — get team stats for dashboard
// @route   GET /api/team/admin/stats
// @access  Private + Admin
// =============================================================================
export const getTeamStats = async (req, res) => {
  try {
    const [totalRes, roleRes, featuredRes] = await Promise.all([
      supabaseAdmin
        .from(TABLES.TEAM)
        .select("id", { count: "exact", head: true }),
      supabaseAdmin.from(TABLES.TEAM).select("role"),
      supabaseAdmin
        .from(TABLES.TEAM)
        .select("id", { count: "exact", head: true })
        .eq("featured", true),
    ]);

    const byRole = (roleRes.data || []).reduce((acc, { role }) => {
      if (role) acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        byRole,
      },
    });
  } catch (err) {
    console.error("[Team] getTeamStats exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Admin — list all members (manage page, all fields)
// @route   GET /api/team/admin/all
// @access  Private + Admin
// =============================================================================
export const adminGetAllMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      join_year,
      featured,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from(TABLES.TEAM)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search?.trim())
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) query = query.eq("role", role);
    if (join_year) query = query.eq("join_year", join_year);
    if (featured === "true") query = query.eq("featured", true);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Team] adminGetAllMembers error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch members." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Team] adminGetAllMembers exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
