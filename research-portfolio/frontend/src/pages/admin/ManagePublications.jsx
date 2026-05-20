// src/pages/admin/ManagePublications.jsx
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
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Upload,
  FileText,
  BookOpen,
  Calendar,
  ExternalLink,
  Filter,
  Download,
} from "lucide-react";
import {
  getPublicationStatsApi,
  getAllPublicationsAdminApi,
  createPublicationApi,
  updatePublicationApi,
  deletePublicationApi,
  bulkDeletePublicationsApi,
  togglePublicationFeaturedApi,
} from "../../api/adminApi";

// ─── Helpers ──────────────────────────────────────────────
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

function Field({
  label,
  name,
  type = "text",
  rows,
  form,
  onChange,
  placeholder,
  required,
}) {
  const base =
    "w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all";
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {rows ? (
        <textarea
          value={form[name]}
          onChange={onChange(name)}
          rows={rows}
          placeholder={placeholder}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={onChange(name)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

// ─── Publication Modal ────────────────────────────────────
function PublicationModal({ publication, onClose, onSave }) {
  const isEdit = !!publication?.id;
  const [form, setForm] = useState({
    title: publication?.title || "",
    authors: (publication?.authors || []).join(", "),
    abstract: publication?.abstract || "",
    keywords: (publication?.keywords || []).join(", "),
    journal_name: publication?.journal_name || "",
    date: publication?.date || "",
    doi: publication?.doi || "",
    featured: publication?.featured || false,
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState(
    publication?.pdf_url ? "Current PDF on file" : "",
  );
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleChange = useCallback(
    (key) => (e) =>
      setForm((p) => ({
        ...p,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      })),
    [],
  );

  const handlePDF = (file) => {
    if (!file) return;
    setPdfFile(file);
    setPdfName(file.name);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.authors) fd.append("authors", form.authors);
      if (form.abstract) fd.append("abstract", form.abstract.trim());
      if (form.keywords) fd.append("keywords", form.keywords);
      if (form.journal_name)
        fd.append("journal_name", form.journal_name.trim());
      if (form.date) fd.append("date", form.date);
      if (form.doi) fd.append("doi", form.doi.trim());
      fd.append("featured", form.featured);
      if (pdfFile) fd.append("pdf", pdfFile);

      const res = isEdit
        ? await updatePublicationApi(publication.id, fd)
        : await createPublicationApi(fd);
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
        style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
      >
        <motion.div
          initial={{ scale: 0.93, y: 28 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-2xl rounded-2xl border border-[#1E293B] overflow-hidden flex flex-col max-h-[92vh]"
          style={{ background: "#0A0F1E" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#0F172A,#0A0F1E)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                {isEdit ? (
                  <Edit3 size={14} className="text-white" />
                ) : (
                  <Plus size={14} className="text-white" />
                )}
              </div>
              <h3 className="text-white font-semibold text-base">
                {isEdit ? "Edit Publication" : "Add Publication"}
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
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(99,102,241,0.2) transparent",
            }}
          >
            <Field
              label="Title"
              name="title"
              form={form}
              onChange={handleChange}
              placeholder="Publication title"
              required
            />
            <Field
              label="Authors (comma separated)"
              name="authors"
              form={form}
              onChange={handleChange}
              placeholder="John Doe, Jane Smith"
            />
            <Field
              label="Abstract"
              name="abstract"
              form={form}
              onChange={handleChange}
              rows={4}
              placeholder="Brief summary of the publication..."
            />
            <Field
              label="Keywords (comma separated)"
              name="keywords"
              form={form}
              onChange={handleChange}
              placeholder="machine learning, nlp, deep learning"
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Journal / Conference"
                name="journal_name"
                form={form}
                onChange={handleChange}
                placeholder="Nature, IEEE, NeurIPS..."
              />
              <Field
                label="Date"
                name="date"
                type="date"
                form={form}
                onChange={handleChange}
              />
            </div>

            <Field
              label="DOI / URL"
              name="doi"
              form={form}
              onChange={handleChange}
              placeholder="https://doi.org/10.xxxx/..."
            />

            {/* PDF Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                PDF File
              </label>
              <div
                className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-[#1E293B] cursor-pointer hover:border-indigo-500/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {pdfName || "Click to upload PDF"}
                  </p>
                  <p className="text-slate-600 text-xs">
                    PDF files only, max 10MB
                  </p>
                </div>
                <Upload size={14} className="text-slate-600 flex-shrink-0" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePDF(e.target.files[0])}
              />
            </div>

            {/* Featured toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() =>
                  setForm((p) => ({ ...p, featured: !p.featured }))
                }
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.featured ? "bg-indigo-500" : "bg-[#1E293B]"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.featured ? "left-5" : "left-0.5"}`}
                />
              </div>
              <span className="text-sm text-slate-300">
                Featured publication
              </span>
            </label>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t border-[#1E293B] flex gap-3 flex-shrink-0"
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
              disabled={saving || !form.title.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Add Publication"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Publication Row (table only) ────────────────────────
function PublicationRow({
  pub,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onToggleFeatured,
  index,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${
        selected ? "bg-indigo-500/5" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
      />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{pub.title}</p>
        <p className="text-slate-600 text-xs truncate">
          {pub.authors?.join(", ") || "—"} · {pub.journal_name || "—"}
        </p>
      </div>
      <p className="hidden lg:block text-slate-600 text-xs whitespace-nowrap">
        {pub.date ? new Date(pub.date).getFullYear() : "—"}
      </p>
      <div className="hidden md:flex items-center gap-1">
        {pub.doi && (
          <a
            href={pub.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        )}
        {pub.pdf_url && (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-500">
            <Download size={12} />
          </span>
        )}
      </div>
      <button
        onClick={onToggleFeatured}
        className={`hidden md:flex items-center gap-1 text-xs transition-colors ${
          pub.featured
            ? "text-amber-400"
            : "text-slate-700 hover:text-slate-500"
        }`}
      >
        <Star size={14} fill={pub.featured ? "currentColor" : "none"} />
      </button>
      <div className="flex items-center gap-1">
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
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function ManagePublications() {
  const [pubs, setPubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
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
      const r = await getPublicationStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  }, []);

  const fetchPubs = useCallback(
    async (pg = 1, q = search, year = yearFilter) => {
      setLoading(true);
      try {
        const r = await getAllPublicationsAdminApi({
          page: pg,
          limit: 15,
          search: q,
          year,
        });
        if (r.success) {
          setPubs(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load publications.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, yearFilter, addToast],
  );

  const fetchPubsRef = useRef(fetchPubs);
  const fetchStatsRef = useRef(fetchStats);
  useEffect(() => {
    fetchPubsRef.current = fetchPubs;
  }, [fetchPubs]);
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    Promise.all([fetchPubsRef.current(page), fetchStatsRef.current()]);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fetchPubsRef.current(page);
  }, [page, yearFilter]); // eslint-disable-line

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchPubsRef.current(1, v);
    }, 400);
  };

  const handleDelete = (pub) => {
    setConfirm({
      open: true,
      title: "Delete Publication",
      message: `Delete "${pub.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deletePublicationApi(pub.id);
          if (r.success) {
            fetchPubsRef.current(page);
            fetchStatsRef.current();
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
      message: `Delete ${selected.length} publication(s)?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await bulkDeletePublicationsApi(selected);
          if (r.success) {
            setSelected([]);
            fetchPubsRef.current(page);
            fetchStatsRef.current();
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

  const handleToggleFeatured = async (pub) => {
    try {
      const r = await togglePublicationFeaturedApi(pub.id);
      if (r.success) {
        setPubs((p) =>
          p.map((x) =>
            x.id === pub.id ? { ...x, featured: r.data.featured } : x,
          ),
        );
        addToast(r.message);
      }
    } catch {
      addToast("Failed.", "error");
    }
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) setPubs((p) => p.map((x) => (x.id === data.id ? data : x)));
    else {
      fetchPubsRef.current(page);
      fetchStatsRef.current();
    }
    setModal(null);
    addToast(isEdit ? "Publication updated." : "Publication added.");
  };

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () =>
    setSelected(selected.length === pubs.length ? [] : pubs.map((p) => p.id));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  const STAT_CARDS = [
    {
      label: "Total",
      value: stats?.total,
      color: "from-violet-500 to-indigo-600",
    },
    {
      label: "Featured",
      value: stats?.featured,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Latest Year",
      value: stats?.latestDate ? new Date(stats.latestDate).getFullYear() : "—",
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Selected",
      value: selected.length || "—",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />

      {modal && (
        <PublicationModal
          publication={modal === "create" ? null : modal}
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
          <h1 className="text-2xl font-bold text-white">Publications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} publications · {stats?.featured ?? 0} featured
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
              fetchPubsRef.current(page);
              fetchStatsRef.current();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-600 hover:to-indigo-700 transition-all"
          >
            <Plus size={15} /> Add Publication
          </motion.button>
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
            placeholder="Search publications..."
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
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="pl-4 pr-8 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>
        {pubs.length > 0 && (
          <button
            onClick={toggleAll}
            className="px-4 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            {selected.length === pubs.length ? "Deselect All" : "Select All"}
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
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#1E293B] text-xs font-bold uppercase tracking-widest text-slate-600">
          <input
            type="checkbox"
            checked={selected.length === pubs.length && pubs.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
          <span>Publication</span>
          <span className="hidden lg:block">Year</span>
          <span className="hidden md:block">Links</span>
          <span className="hidden md:block">Featured</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-[#1E293B]/60">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="load"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-20"
              >
                <Loader2 size={28} className="text-violet-400 animate-spin" />
              </motion.div>
            )}
            {!loading && pubs.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-20 text-slate-600"
              >
                <BookOpen size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No publications found</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!loading &&
              pubs.map((pub, i) => (
                <PublicationRow
                  key={pub.id}
                  pub={pub}
                  index={i}
                  selected={selected.includes(pub.id)}
                  onSelect={() => toggleSelect(pub.id)}
                  onEdit={() => setModal(pub)}
                  onDelete={() => handleDelete(pub)}
                  onToggleFeatured={() => handleToggleFeatured(pub)}
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
