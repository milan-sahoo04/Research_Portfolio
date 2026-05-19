/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/middleware/roleMiddleware.js
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// ROLE HIERARCHY
// Only two roles: user and admin/superadmin
// ─────────────────────────────────────────────
export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const forbidden = (res, message = "Forbidden. Insufficient permissions.") =>
  res.status(403).json({ success: false, message });

const unauthorized = (res, message = "Unauthorized. Please log in.") =>
  res.status(401).json({ success: false, message });

// ─────────────────────────────────────────────
// 1. adminOnly — requires admin or superadmin role
//    Must be used AFTER protect
//    Usage: router.post("/publications", protect, adminOnly, handler)
// ─────────────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (!["admin", "superadmin"].includes(req.user.role)) {
    return forbidden(res, "Admin access required.");
  }

  next();
};

// ─────────────────────────────────────────────
// 2. superAdminOnly — only superadmin
//    For destructive / system-level operations
//    Usage: router.delete("/nuke", protect, superAdminOnly, handler)
// ─────────────────────────────────────────────
export const superAdminOnly = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (req.user.role !== "superadmin") {
    return forbidden(res, "Superadmin access required.");
  }

  next();
};

// ─────────────────────────────────────────────
// 3. requireAdmin — alias for adminOnly
//    Usage: router.get("/feedback", protect, requireAdmin, handler)
// ─────────────────────────────────────────────
export const requireAdmin = adminOnly;

// ─────────────────────────────────────────────
// 4. requireVerified — blocks unverified users
//    Must be used AFTER protect
//    Usage: router.post("/projects", protect, requireVerified, handler)
// ─────────────────────────────────────────────
export const requireVerified = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  if (req.user.is_verified === false) {
    return res.status(403).json({
      success: false,
      message: "Email not verified. Please check your inbox.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

// ─────────────────────────────────────────────
// 5. selfOrAdmin — user can only access their own
//    account, admins can access any
//    Compares req.user.id against req.params.id
//    Usage: router.put("/users/:id", protect, selfOrAdmin, handler)
// ─────────────────────────────────────────────
export const selfOrAdmin = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  const isSelf = req.user.id === req.params.id;

  if (!isAdmin && !isSelf) {
    return forbidden(res, "You can only modify your own account.");
  }

  next();
};

// ─────────────────────────────────────────────
// 6. logRoleAccess — dev/audit logging
//    Usage: router.use(logRoleAccess) (optional, dev only)
// ─────────────────────────────────────────────
export const logRoleAccess = (req, res, next) => {
  if (process.env.NODE_ENV === "development" && req.user) {
    console.log(
      `[RoleAccess] ${req.method} ${req.originalUrl} — user: ${req.user.email} (${req.user.role})`,
    );
  }
  next();
};
