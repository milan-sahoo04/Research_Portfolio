// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/userController.js
// ─────────────────────────────────────────────────────────────────────────────

import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  extractStoragePath,
  deleteFile,
} from "../config/supabaseClient.js";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const SALT_ROUNDS = 12;

function ok(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

/** Strip all sensitive fields before sending user to client */
function sanitizeUser(user) {
  const { ...safe } = user;
  return safe;
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

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET ALL USERS
// GET /api/users/admin
// Query: page, limit, search, role, sort, order, includeDeleted
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      sort = "created_at",
      order = "desc",
      includeDeleted = "false",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const allowedSorts = [
      "created_at",
      "name",
      "email",
      "role",
      "last_login",
      "updated_at",
    ];
    const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = order === "asc";

    let query = supabaseAdmin
      .from(TABLES.USERS)
      .select(
        "id, name, email, role, bio, profile_pic, phone, is_verified, is_active, is_super_admin, last_login, created_at, updated_at, deleted_at",
        { count: "exact" },
      )
      .order(sortCol, { ascending })
      .range(offset, offset + limitNum - 1);

    // Exclude soft-deleted by default
    if (includeDeleted !== "true") {
      query = query.is("deleted_at", null);
    }

    // Filter by role
    if (role && ["admin", "user"].includes(role)) {
      query = query.eq("role", role);
    }

    // Search across name and email
    if (search?.trim()) {
      query = query.or(
        `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[User] getAllUsers DB error:", error.message);
      return fail(res, "Failed to fetch users.", 500);
    }

    return ok(res, {
      data: (data || []).map(sanitizeUser),
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[User] getAllUsers exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET USER BY ID
// GET /api/users/admin/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select(
        "id, name, email, role, bio, profile_pic, phone, is_verified, is_active, is_super_admin, last_login, created_at, updated_at, deleted_at",
      )
      .eq("id", id)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);

    return ok(res, { data: sanitizeUser(user) });
  } catch (err) {
    console.error("[User] getUserById exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET OWN PROFILE  (authenticated user — not admin only)
// GET /api/users/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select(
        "id, name, email, role, bio, profile_pic, phone, is_verified, is_active, last_login, created_at, updated_at",
      )
      .eq("id", req.user.id)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);

    return ok(res, { data: sanitizeUser(user) });
  } catch (err) {
    console.error("[User] getMyProfile exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE USER  (admin — can change role, is_active, is_super_admin)
// PUT /api/users/admin/:id
// Body: { name, email, role, bio, phone, is_active, is_super_admin, password? }
// ─────────────────────────────────────────────────────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      bio,
      phone,
      is_active,
      is_super_admin,
      password,
    } = req.body;

    // ── Verify user exists ──
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, email, role")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !existing) return fail(res, "User not found.", 404);

    // ── Validate email uniqueness if changing ──
    if (email && email.toLowerCase() !== existing.email) {
      const { data: emailTaken } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (emailTaken)
        return fail(res, "Email is already in use by another account.", 409);
    }

    // ── Build update payload (only include provided fields) ──
    const updates = { updated_at: new Date().toISOString() };

    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.toLowerCase().trim();
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (role && ["admin", "user"].includes(role)) updates.role = role;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (is_super_admin !== undefined)
      updates.is_super_admin = Boolean(is_super_admin);

    // ── Optional: admin can reset a user's password ──
    if (password) {
      if (password.length < 8)
        return fail(res, "Password must be at least 8 characters.");
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
      updates.refresh_token = null; // Force re-login
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updates)
      .eq("id", id)
      .select(
        "id, name, email, role, bio, profile_pic, phone, is_verified, is_active, is_super_admin, last_login, created_at, updated_at",
      )
      .single();

    if (updateErr) {
      console.error("[User] updateUser DB error:", updateErr.message);
      return fail(res, "Failed to update user.", 500);
    }

    console.log(`[User] Updated user ${id} by admin: ${req.user.email}`);
    return ok(res, {
      message: "User updated successfully.",
      data: sanitizeUser(updated),
    });
  } catch (err) {
    console.error("[User] updateUser exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. UPDATE OWN PROFILE  (authenticated user — limited fields)
// PUT /api/users/me
// Body: { name, bio, phone }
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyProfile = async (req, res) => {
  try {
    const { name, bio, phone } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name?.trim()) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;

    if (Object.keys(updates).length === 1)
      return fail(res, "No valid fields provided to update.");

    const { data: updated, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updates)
      .eq("id", req.user.id)
      .select(
        "id, name, email, role, bio, profile_pic, phone, is_verified, updated_at",
      )
      .single();

    if (error) {
      console.error("[User] updateMyProfile DB error:", error.message);
      return fail(res, "Failed to update profile.", 500);
    }

    return ok(res, {
      message: "Profile updated successfully.",
      data: sanitizeUser(updated),
    });
  } catch (err) {
    console.error("[User] updateMyProfile exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SOFT DELETE USER
// DELETE /api/users/admin/:id
// Sets deleted_at timestamp (does NOT remove from DB)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id)
      return fail(res, "You cannot delete your own account.", 400);

    // Verify user exists and not already deleted
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, role")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !existing) return fail(res, "User not found.", 404);

    // Prevent deleting another super admin unless requester is also super admin
    if (existing.is_super_admin && !req.user.is_super_admin)
      return fail(res, "Cannot delete a super admin account.", 403);

    const { error: deleteErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        refresh_token: null, // Invalidate all sessions
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (deleteErr) {
      console.error("[User] deleteUser DB error:", deleteErr.message);
      return fail(res, "Failed to delete user.", 500);
    }

    console.log(
      `[User] Soft-deleted user ${id} (${existing.email}) by admin: ${req.user.email}`,
    );

    return ok(res, {
      message: `User "${existing.name}" has been deleted successfully.`,
    });
  } catch (err) {
    console.error("[User] deleteUser exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. RESTORE SOFT-DELETED USER
// PUT /api/users/admin/:id/restore
// ─────────────────────────────────────────────────────────────────────────────
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, deleted_at")
      .eq("id", id)
      .not("deleted_at", "is", null)
      .single();

    if (fetchErr || !existing) return fail(res, "Deleted user not found.", 404);

    const { error: restoreErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (restoreErr) {
      console.error("[User] restoreUser DB error:", restoreErr.message);
      return fail(res, "Failed to restore user.", 500);
    }

    console.log(
      `[User] Restored user ${id} (${existing.email}) by admin: ${req.user.email}`,
    );

    return ok(res, {
      message: `User "${existing.name}" restored successfully.`,
    });
  } catch (err) {
    console.error("[User] restoreUser exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. TOGGLE USER ACTIVE STATUS
// PUT /api/users/admin/:id/toggle-status
// ─────────────────────────────────────────────────────────────────────────────
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id)
      return fail(res, "You cannot deactivate your own account.", 400);

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, is_active")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !existing) return fail(res, "User not found.", 404);

    const newStatus = !existing.is_active;

    const { error: updateErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        is_active: newStatus,
        refresh_token: newStatus ? undefined : null, // revoke sessions on deactivate
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[User] toggleUserStatus DB error:", updateErr.message);
      return fail(res, "Failed to update user status.", 500);
    }

    console.log(
      `[User] ${newStatus ? "Activated" : "Deactivated"} user ${id} by admin: ${req.user.email}`,
    );

    return ok(res, {
      message: `User "${existing.name}" has been ${newStatus ? "activated" : "deactivated"}.`,
      data: { id, is_active: newStatus },
    });
  } catch (err) {
    console.error("[User] toggleUserStatus exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. UPLOAD PROFILE PICTURE  (admin for any user OR self)
// POST /api/users/admin/:id/profile-pic  OR  POST /api/users/me/profile-pic
// Content-Type: multipart/form-data  →  field name: "profile_pic"
// Handled by multer middleware in routes
// ─────────────────────────────────────────────────────────────────────────────
export const uploadProfilePic = async (req, res) => {
  try {
    const targetId = req.params.id || req.user.id;

    // ── Validate file ──
    if (!req.file) return fail(res, "No image file provided.");

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype))
      return fail(res, "Invalid file type. Allowed: JPG, PNG, WebP, GIF.");

    if (req.file.size > MAX_FILE_SIZE_BYTES)
      return fail(res, "File too large. Maximum size is 5 MB.");

    // ── Fetch existing user to get old pic URL ──
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, profile_pic")
      .eq("id", targetId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !existing) return fail(res, "User not found.", 404);

    // ── Upload new image to Supabase Storage ──
    const ext = req.file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const filePath = `${targetId}/profile-${Date.now()}.${ext}`;

    const publicUrl = await uploadFile(
      STORAGE_BUCKETS.PROFILE_PICS,
      filePath,
      req.file.buffer,
      req.file.mimetype,
    );

    // ── Update DB ──
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ profile_pic: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", targetId)
      .select("id, name, email, profile_pic, updated_at")
      .single();

    if (updateErr) {
      console.error("[User] uploadProfilePic DB error:", updateErr.message);
      return fail(res, "Failed to save profile picture.", 500);
    }

    // ── Delete old profile pic from storage (fire-and-forget) ──
    if (existing.profile_pic) {
      try {
        const oldPath = extractStoragePath(
          existing.profile_pic,
          STORAGE_BUCKETS.PROFILE_PICS,
        );
        await deleteFile(STORAGE_BUCKETS.PROFILE_PICS, oldPath);
      } catch (e) {
        console.warn("[User] Failed to delete old profile pic:", e.message);
      }
    }

    console.log(`[User] Profile pic updated for user ${targetId}`);

    return ok(res, {
      message: "Profile picture updated successfully.",
      profile_pic: publicUrl,
      data: sanitizeUser(updated),
    });
  } catch (err) {
    console.error("[User] uploadProfilePic exception:", err.message);
    return fail(res, "Failed to upload profile picture.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. DELETE PROFILE PICTURE
// DELETE /api/users/admin/:id/profile-pic  OR  DELETE /api/users/me/profile-pic
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProfilePic = async (req, res) => {
  try {
    const targetId = req.params.id || req.user.id;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, profile_pic")
      .eq("id", targetId)
      .single();

    if (fetchErr || !existing) return fail(res, "User not found.", 404);
    if (!existing.profile_pic)
      return fail(res, "No profile picture to remove.", 400);

    // Remove from storage
    try {
      const oldPath = extractStoragePath(
        existing.profile_pic,
        STORAGE_BUCKETS.PROFILE_PICS,
      );
      await deleteFile(STORAGE_BUCKETS.PROFILE_PICS, oldPath);
    } catch (e) {
      console.warn("[User] deleteProfilePic storage error:", e.message);
    }

    // Clear from DB
    await supabaseAdmin
      .from(TABLES.USERS)
      .update({ profile_pic: null, updated_at: new Date().toISOString() })
      .eq("id", targetId);

    return ok(res, { message: "Profile picture removed successfully." });
  } catch (err) {
    console.error("[User] deleteProfilePic exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. USER STATS  (admin dashboard)
// GET /api/users/admin/stats
// ─────────────────────────────────────────────────────────────────────────────
export const getUserStats = async (req, res) => {
  try {
    const [
      totalRes,
      activeRes,
      adminRes,
      verifiedRes,
      deletedRes,
      newTodayRes,
    ] = await Promise.all([
      // Total (non-deleted)
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),

      // Active
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("deleted_at", null),

      // Admins
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .is("deleted_at", null),

      // Verified
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .eq("is_verified", true)
        .is("deleted_at", null),

      // Soft-deleted
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .not("deleted_at", "is", null),

      // New today
      supabaseAdmin
        .from(TABLES.USERS)
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0])
        .is("deleted_at", null),
    ]);

    return ok(res, {
      data: {
        total: totalRes.count ?? 0,
        active: activeRes.count ?? 0,
        inactive: (totalRes.count ?? 0) - (activeRes.count ?? 0),
        admins: adminRes.count ?? 0,
        verified: verifiedRes.count ?? 0,
        deleted: deletedRes.count ?? 0,
        newToday: newTodayRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error("[User] getUserStats exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. BULK DELETE USERS
// DELETE /api/users/admin/bulk
// Body: { ids: ["uuid1", "uuid2"] }
// ─────────────────────────────────────────────────────────────────────────────
export const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0)
      return fail(res, "ids must be a non-empty array of UUIDs.");
    if (ids.length > 50)
      return fail(res, "Cannot delete more than 50 users at once.");
    if (ids.includes(req.user.id))
      return fail(res, "You cannot include your own account in bulk delete.");

    const { error, count } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .is("deleted_at", null);

    if (error) {
      console.error("[User] bulkDeleteUsers DB error:", error.message);
      return fail(res, "Failed to delete users.", 500);
    }

    console.log(
      `[User] Bulk soft-deleted ${count} users by admin: ${req.user.email}`,
    );

    return ok(res, {
      message: `${count} user(s) deleted successfully.`,
      deleted: count,
    });
  } catch (err) {
    console.error("[User] bulkDeleteUsers exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. GET ADMINS FOR CHAT  (any authenticated user)
// GET /api/users/admins
// Returns only active, non-deleted admins — safe for regular users
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminsForChat = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, name, email, role, profile_pic")
      .eq("role", "admin")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("[User] getAdminsForChat DB error:", error.message);
      return fail(res, "Failed to fetch admins.", 500);
    }

    return ok(res, { data: data || [] });
  } catch (err) {
    console.error("[User] getAdminsForChat exception:", err.message);
    return fail(res, "Server error.", 500);
  }
};
