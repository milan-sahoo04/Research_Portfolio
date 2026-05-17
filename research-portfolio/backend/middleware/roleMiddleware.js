const { supabaseAdmin, TABLES } = require("../config/supabaseClient");

// ─── Role hierarchy ───────────────────────────────────────────────────────────
// Higher index = more permissions
const ROLE_HIERARCHY = {
  guest: 0,
  user: 1,
  researcher: 2,
  editor: 3,
  moderator: 4,
  admin: 5,
  superadmin: 6,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const forbidden = (res, message = "Forbidden. Insufficient permissions.") =>
  res.status(403).json({ success: false, message });

const unauthorized = (res, message = "Unauthorized. Please log in.") =>
  res.status(401).json({ success: false, message });

const getRoleLevel = (role) => ROLE_HIERARCHY[role] ?? -1;

// ─── 1. checkRole ─────────────────────────────────────────────────────────────
// Exact role match — user must have one of the listed roles.
// Must be used AFTER protect middleware.
// Usage: router.get("/admin", protect, checkRole("admin", "superadmin"), handler)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(
        res,
        `Access requires role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}.`,
      );
    }
    next();
  };
};

// ─── 2. checkMinRole ─────────────────────────────────────────────────────────
// Hierarchy-based check — user must have AT LEAST the given role level.
// E.g. checkMinRole("editor") allows editor, moderator, admin, superadmin.
// Must be used AFTER protect middleware.
// Usage: router.post("/blog", protect, checkMinRole("editor"), handler)
const checkMinRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);

    const userLevel = getRoleLevel(req.user.role);
    const requiredLevel = getRoleLevel(minimumRole);

    if (requiredLevel === -1) {
      console.error(`checkMinRole: unknown role "${minimumRole}"`);
      return res
        .status(500)
        .json({ success: false, message: "Server role configuration error." });
    }

    if (userLevel < requiredLevel) {
      return forbidden(
        res,
        `Minimum role required: ${minimumRole}. Your role: ${req.user.role}.`,
      );
    }

    next();
  };
};

// ─── 3. adminOnly ─────────────────────────────────────────────────────────────
// Shorthand: only admin or superadmin can access.
// Must be used AFTER protect middleware.
// Usage: router.delete("/users/:id", protect, adminOnly, handler)
const adminOnly = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (!["admin", "superadmin"].includes(req.user.role)) {
    return forbidden(res, "Admin access required.");
  }
  next();
};

// ─── 4. superAdminOnly ────────────────────────────────────────────────────────
// Only superadmin can access — for destructive or system-level operations.
// Must be used AFTER protect middleware.
const superAdminOnly = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (req.user.role !== "superadmin") {
    return forbidden(res, "Superadmin access required.");
  }
  next();
};

// ─── 5. ownerOrAdmin ──────────────────────────────────────────────────────────
// User can only access/modify their own resources — OR they are admin/superadmin.
// Compares req.user.id against a param or body field.
// Must be used AFTER protect middleware.
//
// @param getOwnerId — async function(req) that returns the owner's user ID string.
//   It receives the full req object so you can query DB, check params, etc.
//
// Usage:
//   router.put("/projects/:id", protect, ownerOrAdmin(
//     async (req) => {
//       const { data } = await supabaseAdmin.from("projects").select("owner_id").eq("id", req.params.id).single();
//       return data?.owner_id;
//     }
//   ), handler)
const ownerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) return unauthorized(res);

    // Admins bypass ownership check
    if (["admin", "superadmin"].includes(req.user.role)) return next();

    try {
      const ownerId = await getOwnerId(req);

      if (!ownerId) {
        return res
          .status(404)
          .json({ success: false, message: "Resource not found." });
      }

      if (ownerId !== req.user.id) {
        return forbidden(
          res,
          "You can only access or modify your own resources.",
        );
      }

      next();
    } catch (err) {
      console.error("ownerOrAdmin middleware error:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Ownership check failed." });
    }
  };
};

// ─── 6. selfOrAdmin ──────────────────────────────────────────────────────────
// Simpler version of ownerOrAdmin — compares req.user.id against req.params.id directly.
// Use when the route param IS the user ID (e.g. /users/:id).
// Must be used AFTER protect middleware.
// Usage: router.put("/users/:id", protect, selfOrAdmin, handler)
const selfOrAdmin = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const isSelf = req.user.id === req.params.id;

  if (!isAdmin && !isSelf) {
    return forbidden(res, "You can only modify your own account.");
  }
  next();
};

// ─── 7. dynamicRoleCheck ─────────────────────────────────────────────────────
// Advanced: accepts a custom async function that returns true/false.
// Use for complex business rules that don't fit the patterns above.
//
// Usage:
//   router.post("/team/:id/publish", protect, dynamicRoleCheck(async (req) => {
//     // custom logic — e.g. check if user is a team member
//     const { data } = await supabaseAdmin.from("team_members")
//       .select("id").eq("user_id", req.user.id).eq("team_id", req.params.id).single();
//     return !!data;
//   }, "You must be a team member to publish."), handler)
const dynamicRoleCheck = (checkFn, denyMessage = "Forbidden.") => {
  return async (req, res, next) => {
    if (!req.user) return unauthorized(res);

    try {
      const allowed = await checkFn(req);
      if (!allowed) return forbidden(res, denyMessage);
      next();
    } catch (err) {
      console.error("dynamicRoleCheck error:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "Permission check failed." });
    }
  };
};

// ─── 8. attachRole ────────────────────────────────────────────────────────────
// Middleware that fetches and attaches req.userRole from DB — useful when you
// need the role for conditional logic in the handler without blocking access.
// Must be used AFTER protect middleware.
const attachRole = async (req, res, next) => {
  if (!req.user) return next();

  try {
    const { data } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("role")
      .eq("id", req.user.id)
      .single();

    req.userRole = data?.role ?? "user";
    req.isAdmin = ["admin", "superadmin"].includes(req.userRole);
    next();
  } catch (err) {
    console.error("attachRole error:", err.message);
    req.userRole = req.user?.role ?? "user";
    req.isAdmin = false;
    next();
  }
};

// ─── 9. logRoleAccess ────────────────────────────────────────────────────────
// Dev/audit middleware — logs role-based access attempts to console.
// Use in development or wrap with your logger in production.
const logRoleAccess = (req, res, next) => {
  if (process.env.NODE_ENV === "development" && req.user) {
    console.log(
      `[RoleAccess] ${req.method} ${req.originalUrl} — user: ${req.user.email} (${req.user.role})`,
    );
  }
  next();
};

module.exports = {
  ROLE_HIERARCHY,
  getRoleLevel,
  checkRole,
  checkMinRole,
  adminOnly,
  superAdminOnly,
  ownerOrAdmin,
  selfOrAdmin,
  dynamicRoleCheck,
  attachRole,
  logRoleAccess,
};
