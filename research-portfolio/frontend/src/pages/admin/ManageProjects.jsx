// src/pages/admin/ManageProjects.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Star,
  Globe,
  Lock,
  ExternalLink,
  GitBranch, // ✅ FIX 1: replaced non-existent "Github" with "GitBranch"
  Loader2,
  RefreshCw,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
  Filter,
  Upload,
} from "lucide-react";
import {
  getAllProjectsAdminApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
  bulkDeleteProjectsApi,
  toggleProjectFeaturedApi,
  getProjectStatsApi,
} from "../../api/adminApi";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIX 2: Field lifted OUTSIDE ProjectModal so React doesn't remount it on
//    every parent re-render, which caused inputs to lose focus and reset.
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, name, type = "text", options, rows, form, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        {label}
      </label>
      {options ? (
        <div className="relative">
          <select
            value={form[name]}
            onChange={onChange(name)}
            className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>
      ) : rows ? (
        <textarea
          value={form[name]}
          onChange={onChange(name)}
          rows={rows}
          className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={onChange(name)}
          className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
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
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
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

// ─── Project Form Modal ───────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onSave }) {
  const isEdit = !!project?.id;

  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    category: project?.category || "",
    tags: (project?.tags || []).join(", "),
    github_url: project?.github_url || "",
    demo_url: project?.demo_url || "",
    year: project?.year || "",
    status: project?.status || "Ongoing",
    visibility: project?.visibility || "public",
    featured: project?.featured || false,
    stars: project?.stars || "",
    forks: project?.forks || "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(project?.image || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // ✅ Stable onChange factory — passes down to Field so it doesn't need
  //    to be redefined inside the component tree each render.
  const handleChange = useCallback(
    (key) => (e) =>
      setForm((prev) => ({
        ...prev,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      })),
    [],
  );

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null) fd.append(k, v);
      });
      if (imageFile) fd.append("image", imageFile);
      const res = isEdit
        ? await updateProjectApi(project.id, fd)
        : await createProjectApi(fd);
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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                {isEdit ? (
                  <Edit3 size={14} className="text-white" />
                ) : (
                  <Plus size={14} className="text-white" />
                )}
              </div>
              <h3 className="text-white font-semibold">
                {isEdit ? "Edit Project" : "New Project"}
              </h3>
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
            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Cover Image
              </label>
              <div
                className="relative h-36 rounded-xl border border-dashed border-[#1E293B] overflow-hidden cursor-pointer group"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImage(e.dataTransfer.files[0]);
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
                    <Upload size={24} />
                    <span className="text-xs">Click or drag image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={20} className="text-white" />
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImage(e.target.files[0])}
              />
            </div>

            {/* ✅ All Field calls now pass `form` and `onChange` as props */}
            <Field
              label="Title *"
              name="title"
              form={form}
              onChange={handleChange}
            />
            <Field
              label="Description"
              name="description"
              form={form}
              onChange={handleChange}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Category"
                name="category"
                form={form}
                onChange={handleChange}
              />
              <Field
                label="Year"
                name="year"
                form={form}
                onChange={handleChange}
              />
            </div>

            <Field
              label="Tags (comma separated)"
              name="tags"
              form={form}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="GitHub URL"
                name="github_url"
                form={form}
                onChange={handleChange}
              />
              <Field
                label="Demo URL"
                name="demo_url"
                form={form}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Stars"
                name="stars"
                type="number"
                form={form}
                onChange={handleChange}
              />
              <Field
                label="Forks"
                name="forks"
                type="number"
                form={form}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Status"
                name="status"
                form={form}
                onChange={handleChange}
                options={[
                  { value: "Ongoing", label: "Ongoing" },
                  { value: "Completed", label: "Completed" },
                ]}
              />
              <Field
                label="Visibility"
                name="visibility"
                form={form}
                onChange={handleChange}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                ]}
              />
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={handleChange("featured")}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-sm text-slate-300">Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#1E293B] flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Project"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const timer = useRef(null);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await getProjectStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  }, []); // no deps — only called explicitly

  const fetchProjects = useCallback(
    async (pg = 1, q = search, st = statusFilter) => {
      setLoading(true);
      try {
        const r = await getAllProjectsAdminApi({
          page: pg,
          limit: 15,
          search: q,
          status: st,
        });
        if (r.success) {
          setProjects(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load projects.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, addToast],
  );

  // ✅ FIX: single useEffect, fetches stats + projects together on mount.
  //    page / statusFilter changes re-fetch projects only (no stats needed).
  //    Using refs to avoid stale-closure re-runs from useCallback deps.
  const fetchProjectsRef = useRef(fetchProjects);
  const fetchStatsRef = useRef(fetchStats);
  useEffect(() => {
    fetchProjectsRef.current = fetchProjects;
  }, [fetchProjects]);
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  const isFirstMount = useRef(true);

  useEffect(() => {
    // Mount: load both in parallel
    Promise.all([fetchProjectsRef.current(page), fetchStatsRef.current()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  useEffect(() => {
    // Skip the very first run (already handled by mount effect above)
    // Only fires on subsequent page or statusFilter changes
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchProjectsRef.current(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchProjects(1, v);
    }, 400);
  };

  const handleDelete = (p) => {
    setConfirm({
      open: true,
      title: "Delete Project",
      message: `Delete "${p.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deleteProjectApi(p.id);
          if (r.success) {
            fetchProjects(page);
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

  const handleBulkDelete = () => {
    setConfirm({
      open: true,
      title: "Bulk Delete",
      message: `Delete ${selected.length} project(s)?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await bulkDeleteProjectsApi(selected);
          if (r.success) {
            setSelected([]);
            fetchProjects(page);
            fetchStats();
            addToast(r.message);
          }
        } catch {
          addToast("Bulk delete failed.", "error");
        } finally {
          setActionLoading(false);
          setConfirm({ open: false });
        }
      },
    });
  };

  const handleToggleFeatured = async (p) => {
    try {
      const r = await toggleProjectFeaturedApi(p.id);
      if (r.success) {
        setProjects((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, featured: r.data.featured } : x,
          ),
        );
        addToast(r.message);
      }
    } catch {
      addToast("Failed.", "error");
    }
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) setProjects((p) => p.map((x) => (x.id === data.id ? data : x)));
    else {
      fetchProjects(page);
      fetchStats();
    }
    setModal(null);
    addToast(isEdit ? "Project updated." : "Project created.");
  };

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const toggleAll = () =>
    setSelected(
      selected.length === projects.length ? [] : projects.map((p) => p.id),
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />

      {modal && (
        <ProjectModal
          project={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

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
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} total · {stats?.featured ?? 0} featured
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
              fetchProjects(page);
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 transition-all"
          >
            <Plus size={15} /> New Project
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats?.total },
          { label: "Featured", value: stats?.featured },
          { label: "Completed", value: stats?.byStatus?.Completed ?? 0 },
          { label: "Ongoing", value: stats?.byStatus?.Ongoing ?? 0 },
        ].map(({ label, value }, i) => (
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
            <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3 p-4 rounded-2xl border border-[#1E293B]"
        style={{
          background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)",
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
            placeholder="Search projects..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="pl-4 pr-8 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
          >
            <option value="">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-[#1E293B] overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)",
        }}
      >
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#1E293B] text-xs font-bold uppercase tracking-widest text-slate-600">
          <input
            type="checkbox"
            checked={selected.length === projects.length && projects.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
          <span>Project</span>
          <span className="hidden md:block">Status</span>
          <span className="hidden lg:block">Year</span>
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
                <Loader2 size={28} className="text-violet-400 animate-spin" />
              </motion.div>
            ) : projects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 text-slate-600"
              >
                <FolderOpen size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No projects found</p>
              </motion.div>
            ) : (
              projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${selected.includes(p.id) ? "bg-violet-500/5" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={16} className="text-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {p.title}
                      </p>
                      <p className="text-slate-600 text-xs truncate">
                        {p.category || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${p.status === "Completed" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-sky-500/15 text-sky-400 border border-sky-500/20"}`}
                    >
                      {p.status || "—"}
                    </span>
                  </div>
                  <p className="hidden lg:block text-slate-600 text-xs">
                    {p.year || "—"}
                  </p>
                  <button
                    onClick={() => handleToggleFeatured(p)}
                    className={`hidden md:flex items-center gap-1 text-xs transition-colors ${p.featured ? "text-amber-400" : "text-slate-700 hover:text-slate-500"}`}
                  >
                    <Star
                      size={14}
                      fill={p.featured ? "currentColor" : "none"}
                    />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal(p)}
                      className="w-7 h-7 rounded-lg hover:bg-indigo-500/10 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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
