// src/pages/admin/ManageUsers.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Trash2,
  Edit3,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Users,
  UserCheck,
  UserX,
  Shield,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  Calendar,
  Crown,
} from "lucide-react";
import {
  getAllUsersApi,
  getUserStatsApi,
  updateUserApi,
  deleteUserApi,
  bulkDeleteUsersApi,
  restoreUserApi,
  toggleUserStatusApi,
} from "../../api/userApi";

// ─── Toast ────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium pointer-events-auto border backdrop-blur-xl ${
              t.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/15 border-red-500/30 text-red-300"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle size={15} />
            ) : (
              <XCircle size={15} />
            )}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  danger = true,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
            className="w-full max-w-sm rounded-2xl border border-[#1E293B] p-6"
            style={{ background: "#0F172A" }}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-red-500/15" : "bg-amber-500/15"}`}
            >
              <AlertTriangle
                size={22}
                className={danger ? "text-red-400" : "text-amber-400"}
              />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}{" "}
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Edit User Modal ──────────────────────────────────────
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
    bio: user.bio || "",
    phone: user.phone || "",
    is_active: user.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const r = await updateUserApi(user.id, form);
      if (r.success) onSave(r.data);
    } catch {
      setError("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const base =
    "w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 28 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-[#1E293B] overflow-hidden flex flex-col max-h-[92vh]"
        style={{ background: "#0A0F1E" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]"
          style={{ background: "linear-gradient(135deg,#0F172A,#0A0F1E)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Edit3 size={14} className="text-white" />
            </div>
            <h3 className="text-white font-semibold">Edit User</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-[#1E293B]">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              {user.profile_pic ? (
                <img
                  src={user.profile_pic}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-slate-500 text-xs">{user.email}</p>
              <p className="text-slate-600 text-xs mt-0.5">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className={base}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className={base}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
                className={`${base} appearance-none`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className={base}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className={`${base} resize-none`}
              placeholder="Short bio..."
            />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() =>
                setForm((p) => ({ ...p, is_active: !p.is_active }))
              }
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.is_active ? "bg-emerald-500" : "bg-[#1E293B]"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_active ? "left-5" : "left-0.5"}`}
              />
            </div>
            <span className="text-sm text-slate-300">Account active</span>
          </label>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-[#1E293B] flex gap-3"
          style={{ background: "linear-gradient(135deg,#0F172A,#0A0F1E)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── User Row ─────────────────────────────────────────────
function UserRow({
  user,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  onRestore,
  index,
}) {
  const isDeleted = !!user.deleted_at;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${selected ? "bg-indigo-500/5" : ""} ${isDeleted ? "opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
      />

      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          {user.profile_pic ? (
            <img
              src={user.profile_pic}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-medium truncate">
              {user.name}
            </p>
            {user.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold flex-shrink-0 flex items-center gap-1">
                <Crown size={8} /> Admin
              </span>
            )}
            {isDeleted && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 font-semibold">
                Deleted
              </span>
            )}
          </div>
          <p className="text-slate-600 text-xs truncate">{user.email}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="hidden md:flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-400" : "bg-slate-600"}`}
        />
        <span
          className={`text-xs ${user.is_active ? "text-emerald-400" : "text-slate-600"}`}
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Verified */}
      <div className="hidden lg:flex items-center">
        {user.is_verified ? (
          <CheckCircle size={13} className="text-emerald-400" />
        ) : (
          <XCircle size={13} className="text-slate-700" />
        )}
      </div>

      {/* Joined */}
      <p className="hidden lg:block text-slate-600 text-xs whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {isDeleted ? (
          <button
            onClick={onRestore}
            className="w-7 h-7 rounded-lg hover:bg-emerald-500/10 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors"
            title="Restore"
          >
            <RotateCcw size={13} />
          </button>
        ) : (
          <>
            <button
              onClick={onToggleStatus}
              className="w-7 h-7 rounded-lg hover:bg-amber-500/10 flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors"
              title={user.is_active ? "Deactivate" : "Activate"}
            >
              {user.is_active ? (
                <ToggleRight size={14} />
              ) : (
                <ToggleLeft size={14} />
              )}
            </button>
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg hover:bg-indigo-500/10 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const timer = useRef(null);
  const isFirst = useRef(true);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await getUserStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  }, []);

  const fetchUsers = useCallback(
    async (pg = 1, q = search, role = roleFilter, deleted = includeDeleted) => {
      setLoading(true);
      try {
        const r = await getAllUsersApi({
          page: pg,
          limit: 15,
          search: q,
          role,
          includeDeleted: deleted,
        });
        if (r.success) {
          setUsers(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load users.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, includeDeleted, addToast],
  );

  const fetchUsersRef = useRef(fetchUsers);
  const fetchStatsRef = useRef(fetchStats);
  useEffect(() => {
    fetchUsersRef.current = fetchUsers;
  }, [fetchUsers]);
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    Promise.all([fetchUsersRef.current(page), fetchStatsRef.current()]);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fetchUsersRef.current(page);
  }, [page, roleFilter, includeDeleted]); // eslint-disable-line

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchUsersRef.current(1, v);
    }, 400);
  };

  const handleDelete = (user) => {
    setConfirm({
      open: true,
      title: "Delete User",
      message: `Soft-delete "${user.name}"? They won't be able to log in but data is preserved.`,
      danger: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deleteUserApi(user.id);
          if (r.success) {
            fetchUsersRef.current(page);
            fetchStatsRef.current();
            addToast(r.message);
          }
        } catch (e) {
          addToast(e?.response?.data?.message || "Delete failed.", "error");
        } finally {
          setActionLoading(false);
          setConfirm({ open: false });
        }
      },
    });
  };

  const handleRestore = (user) => {
    setConfirm({
      open: true,
      title: "Restore User",
      message: `Restore "${user.name}"? Their account will be reactivated.`,
      danger: false,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await restoreUserApi(user.id);
          if (r.success) {
            fetchUsersRef.current(page);
            fetchStatsRef.current();
            addToast(r.message);
          }
        } catch {
          addToast("Restore failed.", "error");
        } finally {
          setActionLoading(false);
          setConfirm({ open: false });
        }
      },
    });
  };

  const handleToggleStatus = async (user) => {
    try {
      const r = await toggleUserStatusApi(user.id);
      if (r.success) {
        setUsers((p) =>
          p.map((u) =>
            u.id === user.id ? { ...u, is_active: r.data.is_active } : u,
          ),
        );
        fetchStatsRef.current();
        addToast(r.message);
      }
    } catch (e) {
      addToast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  const handleBulkDelete = () => {
    setConfirm({
      open: true,
      title: "Bulk Delete",
      message: `Soft-delete ${selected.length} user(s)?`,
      danger: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await bulkDeleteUsersApi(selected);
          if (r.success) {
            setSelected([]);
            fetchUsersRef.current(page);
            fetchStatsRef.current();
            addToast(r.message);
          }
        } catch (e) {
          addToast(
            e?.response?.data?.message || "Bulk delete failed.",
            "error",
          );
        } finally {
          setActionLoading(false);
          setConfirm({ open: false });
        }
      },
    });
  };

  const handleSaveEdit = (updated) => {
    setUsers((p) => p.map((u) => (u.id === updated.id ? updated : u)));
    fetchStatsRef.current();
    setEditUser(null);
    addToast("User updated successfully.");
  };

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () =>
    setSelected(selected.length === users.length ? [] : users.map((u) => u.id));

  const STAT_CARDS = [
    {
      label: "Total",
      value: stats?.total,
      color: "from-indigo-500 to-blue-600",
    },
    {
      label: "Active",
      value: stats?.active,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Admins",
      value: stats?.admins,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Verified",
      value: stats?.verified,
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />

      <AnimatePresence>
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleSaveEdit}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        {...confirm}
        loading={actionLoading}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} users · {stats?.active ?? 0} active ·{" "}
            {stats?.admins ?? 0} admins
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={14} /> Delete {selected.length}
            </motion.button>
          )}
          <button
            onClick={() => {
              fetchUsersRef.current(page);
              fetchStatsRef.current();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-[#1E293B] p-4 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
            }}
          >
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-gradient-to-r ${color}`}
            />
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3 p-4 rounded-2xl border border-[#1E293B]"
        style={{
          background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
        }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="pl-4 pr-8 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>

        <button
          onClick={() => {
            setIncludeDeleted((p) => !p);
            setPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${includeDeleted ? "bg-red-500/15 border-red-500/30 text-red-400" : "border-[#1E293B] text-slate-400 hover:bg-white/5"}`}
        >
          {includeDeleted ? "Hide Deleted" : "Show Deleted"}
        </button>

        {users.length > 0 && (
          <button
            onClick={toggleAll}
            className="px-4 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            {selected.length === users.length ? "Deselect All" : "Select All"}
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#1E293B] overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
        }}
      >
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#1E293B] text-xs font-bold uppercase tracking-widest text-slate-600">
          <input
            type="checkbox"
            checked={selected.length === users.length && users.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
          <span>User</span>
          <span className="hidden md:block">Status</span>
          <span className="hidden lg:block">Verified</span>
          <span className="hidden lg:block">Joined</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-[#1E293B]/60">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="load"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-20"
              >
                <Loader2 size={28} className="text-violet-400 animate-spin" />
              </motion.div>
            ) : users.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 text-slate-600"
              >
                <Users size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No users found</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {!loading &&
              users.map((user, i) => (
                <UserRow
                  key={user.id}
                  user={user}
                  index={i}
                  selected={selected.includes(user.id)}
                  onSelect={() => toggleSelect(user.id)}
                  onEdit={() => setEditUser(user)}
                  onDelete={() => handleDelete(user)}
                  onToggleStatus={() => handleToggleStatus(user)}
                  onRestore={() => handleRestore(user)}
                />
              ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-slate-600 text-sm">
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-[#1E293B] flex items-center justify-center text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-xl border border-[#1E293B] flex items-center justify-center text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
