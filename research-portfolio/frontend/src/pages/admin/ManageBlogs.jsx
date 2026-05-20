// src/pages/admin/ManageBlogs.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Star,
  Loader2,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Upload,
} from "lucide-react";
import {
  getAllBlogsAdminApi,
  createBlogApi,
  updateBlogApi,
  deleteBlogApi,
  bulkDeleteBlogsApi,
  toggleBlogFeaturedApi,
  getBlogStatsApi,
  uploadBlogImageApi,
} from "../../api/adminApi";

function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium pointer-events-auto border backdrop-blur-xl ${t.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-red-500/15 border-red-500/30 text-red-300"}`}
          >
            {t.type === "success" ? (
              <CheckCircle size={15} />
            ) : (
              <XCircle size={15} />
            )}{" "}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
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
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
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

function BlogModal({ blog, onClose, onSave }) {
  const isEdit = !!blog?.id;
  const [form, setForm] = useState({
    title: blog?.title || "",
    content: blog?.content || "",
    excerpt: blog?.excerpt || "",
    tags: (blog?.tags || []).join(", "),
    category: blog?.category || "",
    status: blog?.status || "draft",
    featured: blog?.featured || false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(blog?.image || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) =>
    setForm((p) => ({
      ...p,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await updateBlogApi(blog.id, {
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });
        if (res.success && imageFile)
          await uploadBlogImageApi(blog.id, imageFile);
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (imageFile) fd.append("image", imageFile);
        res = await createBlogApi(fd);
      }
      if (res.success) onSave(res.data, isEdit);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      >
        <motion.div
          initial={{ scale: 0.93, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-2xl rounded-2xl border border-[#1E293B] overflow-hidden flex flex-col max-h-[90vh]"
          style={{ background: "#0F172A" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                {isEdit ? (
                  <Edit3 size={14} className="text-white" />
                ) : (
                  <Plus size={14} className="text-white" />
                )}
              </div>
              <h3 className="text-white font-semibold">
                {isEdit ? "Edit Blog" : "New Blog Post"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Image */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Cover Image
              </label>
              <div
                className="relative h-32 rounded-xl border border-dashed border-[#1E293B] overflow-hidden cursor-pointer group"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) {
                    setImageFile(f);
                    const r = new FileReader();
                    r.onload = (ev) => setImagePreview(ev.target.result);
                    r.readAsDataURL(f);
                  }
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                    <Upload size={22} />
                    <span className="text-xs">Click or drag image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={18} className="text-white" />
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setImageFile(f);
                    const r = new FileReader();
                    r.onload = (ev) => setImagePreview(ev.target.result);
                    r.readAsDataURL(f);
                  }
                }}
              />
            </div>
            {[
              ["Title *", "title"],
              ["Excerpt", "excerpt"],
              ["Category", "category"],
              ["Tags (comma separated)", "tags"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={set("content")}
                rows={6}
                className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-sky-500/50 transition-all resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <select
                  value={form.status}
                  onChange={set("status")}
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none appearance-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={set("featured")}
                  className="w-4 h-4 rounded accent-sky-500"
                />
                <span className="text-sm text-slate-300">Featured</span>
              </label>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#1E293B] flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-cyan-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}{" "}
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Publish"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ManageBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const timer = useRef(null);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchStats = async () => {
    try {
      const r = await getBlogStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  };
  const fetchBlogs = useCallback(
    async (pg = 1, q = search) => {
      setLoading(true);
      try {
        const r = await getAllBlogsAdminApi({ page: pg, limit: 15, search: q });
        if (r.success) {
          setBlogs(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load blogs.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchStats();
  }, []);
  useEffect(() => {
    fetchBlogs(page);
  }, [page]);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchBlogs(1, v);
    }, 400);
  };

  const handleDelete = (b) => {
    setConfirm({
      open: true,
      title: "Delete Blog",
      message: `Delete "${b.title}"?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deleteBlogApi(b.id);
          if (r.success) {
            fetchBlogs(page);
            fetchStats();
            addToast(r.message);
          }
        } catch {
          addToast("Delete failed.", "error");
        } finally {
          setActionLoading(false);
          setConfirm({ open: false });
        }
      },
    });
  };

  const handleToggleFeatured = async (b) => {
    try {
      const r = await toggleBlogFeaturedApi(b.id);
      if (r.success) {
        setBlogs((p) =>
          p.map((x) => (x.id === b.id ? { ...x, featured: !x.featured } : x)),
        );
        addToast(r.message);
      }
    } catch {
      addToast("Failed.", "error");
    }
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) setBlogs((p) => p.map((x) => (x.id === data.id ? data : x)));
    else {
      fetchBlogs(page);
      fetchStats();
    }
    setModal(null);
    addToast(isEdit ? "Blog updated." : "Blog created.");
  };

  const toggleAll = () =>
    setSelected(selected.length === blogs.length ? [] : blogs.map((b) => b.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />
      {modal && (
        <BlogModal
          blog={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      <ConfirmModal
        {...confirm}
        loading={actionLoading}
        onCancel={() => setConfirm({ open: false })}
      />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} posts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchBlogs(page);
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          {selected.length > 0 && (
            <button
              onClick={() =>
                setConfirm({
                  open: true,
                  title: "Bulk Delete",
                  message: `Delete ${selected.length} blogs?`,
                  onConfirm: async () => {
                    setActionLoading(true);
                    try {
                      await bulkDeleteBlogsApi(selected);
                      setSelected([]);
                      fetchBlogs(page);
                      fetchStats();
                      addToast("Deleted.");
                    } catch {
                      addToast("Failed.", "error");
                    } finally {
                      setActionLoading(false);
                      setConfirm({ open: false });
                    }
                  },
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Trash2 size={14} /> Delete {selected.length}
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-cyan-600 text-white hover:from-sky-600 hover:to-cyan-700 transition-all"
          >
            <Plus size={15} /> New Post
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Total", stats?.total],
          ["Published", stats?.published ?? 0],
          ["Drafts", stats?.drafts ?? 0],
          ["Featured", stats?.featured ?? 0],
        ].map(([label, val], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-[#1E293B] p-4 text-center"
            style={{
              background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)",
            }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-white">{val ?? "—"}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search blog posts..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-all"
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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-[#1E293B] overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)",
        }}
      >
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#1E293B] text-xs font-bold uppercase tracking-widest text-slate-600">
          <input
            type="checkbox"
            checked={selected.length === blogs.length && blogs.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
          <span>Post</span>
          <span className="hidden md:block">Status</span>
          <span className="hidden md:block">Featured</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-[#1E293B]/60">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="load"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-20"
              >
                <Loader2 size={28} className="text-sky-400 animate-spin" />
              </motion.div>
            ) : blogs.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 text-slate-600"
              >
                <FileText size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No posts found</p>
              </motion.div>
            ) : (
              blogs.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${selected.includes(b.id) ? "bg-sky-500/5" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(b.id)}
                    onChange={() =>
                      setSelected((p) =>
                        p.includes(b.id)
                          ? p.filter((x) => x !== b.id)
                          : [...p, b.id],
                      )
                    }
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    {b.image ? (
                      <img
                        src={b.image}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {b.title}
                      </p>
                      <p className="text-slate-600 text-xs">
                        {b.category || "—"} ·{" "}
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`hidden md:inline-flex text-xs px-2.5 py-1 rounded-lg font-medium ${b.status === "published" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}
                  >
                    {b.status || "draft"}
                  </span>
                  <button
                    onClick={() => handleToggleFeatured(b)}
                    className={`hidden md:flex ${b.featured ? "text-amber-400" : "text-slate-700 hover:text-slate-500"}`}
                  >
                    <Star
                      size={14}
                      fill={b.featured ? "currentColor" : "none"}
                    />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal(b)}
                      className="w-7 h-7 rounded-lg hover:bg-sky-500/10 flex items-center justify-center text-slate-500 hover:text-sky-400 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-600 text-sm">
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
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
