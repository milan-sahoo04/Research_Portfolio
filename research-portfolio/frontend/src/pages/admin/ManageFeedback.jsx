// src/pages/admin/ManageFeedback.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  MessageSquare,
  Calendar,
  Eye,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  getFeedbackStatsApi,
  getAllFeedbackApi,
  deleteFeedbackApi,
  bulkDeleteFeedbackApi,
} from "../../api/adminApi";

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

// ─── Detail Modal ─────────────────────────────────────────
function DetailModal({ feedback, onClose }) {
  if (!feedback) return null;
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
          className="w-full max-w-lg rounded-2xl border border-[#1E293B] overflow-hidden"
          style={{ background: "#0A0F1E" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]"
            style={{ background: "linear-gradient(135deg,#0F172A,#0A0F1E)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <MessageSquare size={14} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-base">
                Message Details
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
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-[#1E293B]">
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-1">
                  From
                </p>
                <p className="text-white text-sm font-medium">
                  {feedback.name}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-[#1E293B]">
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-1">
                  Email
                </p>
                <a
                  href={`mailto:${feedback.email}`}
                  className="text-cyan-400 text-sm font-medium hover:underline truncate block"
                >
                  {feedback.email}
                </a>
              </div>
            </div>

            {feedback.subject && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-[#1E293B]">
                <p className="text-slate-600 text-xs uppercase tracking-widest mb-1">
                  Subject
                </p>
                <p className="text-white text-sm">{feedback.subject}</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/[0.02] border border-[#1E293B]">
              <p className="text-slate-600 text-xs uppercase tracking-widest mb-2">
                Message
              </p>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {feedback.message}
              </p>
            </div>

            <div className="flex items-center gap-2 text-slate-600 text-xs">
              <Clock size={11} />
              <span>
                Received {new Date(feedback.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t border-[#1E293B] flex gap-3"
            style={{ background: "linear-gradient(135deg,#0F172A,#0A0F1E)" }}
          >
            <a
              href={`mailto:${feedback.email}?subject=Re: ${feedback.subject || "Your message"}`}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
            >
              <Mail size={14} /> Reply via Email
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Feedback Card ────────────────────────────────────────
function FeedbackCard({
  feedback,
  selected,
  onSelect,
  onView,
  onDelete,
  index,
}) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className={`relative rounded-2xl border overflow-hidden transition-all group ${
        selected
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-[#1E293B] hover:border-[#2D3F55]"
      }`}
      style={{
        background: selected
          ? undefined
          : "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
      }}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
        />
      </div>

      <div className="pt-8 pb-4 px-4 space-y-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-emerald-400">
              {feedback.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {feedback.name}
            </p>
            <p className="text-slate-600 text-xs truncate">{feedback.email}</p>
          </div>
        </div>

        {/* Subject */}
        {feedback.subject && (
          <p className="text-slate-400 text-xs font-medium truncate px-1">
            {feedback.subject}
          </p>
        )}

        {/* Message preview */}
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 px-1">
          {feedback.message}
        </p>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-slate-700 text-xs px-1">
          <Clock size={10} />
          <span>{timeAgo(feedback.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-[#1E293B]">
        <button
          onClick={onView}
          className="flex-1 py-2 text-xs text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-1"
        >
          <Eye size={11} /> View
        </button>
        <div className="w-px bg-[#1E293B]" />
        <button
          onClick={onDelete}
          className="flex-1 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function ManageFeedback() {
  const [messages, setMessages] = useState([]);
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
  const [detailModal, setDetailModal] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState("grid"); // grid | table
  const timer = useRef(null);
  const isFirst = useRef(true);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await getFeedbackStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  }, []);

  const fetchMessages = useCallback(
    async (pg = 1, q = search) => {
      setLoading(true);
      try {
        const r = await getAllFeedbackApi({ page: pg, limit: 20, search: q });
        if (r.success) {
          setMessages(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load messages.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, addToast],
  );

  const fetchMessagesRef = useRef(fetchMessages);
  const fetchStatsRef = useRef(fetchStats);
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    Promise.all([fetchMessagesRef.current(page), fetchStatsRef.current()]);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fetchMessagesRef.current(page);
  }, [page]); // eslint-disable-line

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchMessagesRef.current(1, v);
    }, 400);
  };

  const handleDelete = (msg) => {
    setConfirm({
      open: true,
      title: "Delete Message",
      message: `Delete message from "${msg.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deleteFeedbackApi(msg.id);
          if (r.success) {
            fetchMessagesRef.current(page);
            fetchStatsRef.current();
            addToast(r.message);
            if (detailModal?.id === msg.id) setDetailModal(null);
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
      message: `Delete ${selected.length} message(s)?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await bulkDeleteFeedbackApi(selected);
          if (r.success) {
            setSelected([]);
            fetchMessagesRef.current(page);
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

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () =>
    setSelected(
      selected.length === messages.length ? [] : messages.map((m) => m.id),
    );

  const STAT_CARDS = [
    {
      label: "Total",
      value: stats?.total,
      color: "from-emerald-500 to-teal-600",
      icon: MessageSquare,
    },
    {
      label: "Today",
      value: stats?.today,
      color: "from-cyan-500 to-blue-600",
      icon: Calendar,
    },
    {
      label: "This Week",
      value: stats?.thisWeek,
      color: "from-violet-500 to-purple-600",
      icon: TrendingUp,
    },
    {
      label: "Selected",
      value: selected.length || "—",
      color: "from-amber-500 to-orange-600",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />

      <DetailModal
        feedback={detailModal}
        onClose={() => setDetailModal(null)}
      />
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
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} messages · {stats?.today ?? 0} today
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
          {/* Grid / Table toggle */}
          <div className="flex items-center rounded-xl border border-[#1E293B] overflow-hidden">
            {["grid", "table"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-medium transition-colors capitalize ${
                  view === v
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              fetchMessagesRef.current(page);
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
        {STAT_CARDS.map(({ label, value, color, icon: Icon }, i) => (
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
            placeholder="Search by name, email, subject..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
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
        {messages.length > 0 && (
          <button
            onClick={toggleAll}
            className="px-4 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            {selected.length === messages.length
              ? "Deselect All"
              : "Select All"}
          </button>
        )}
      </motion.div>

      {/* Grid View */}
      {view === "grid" && (
        <div>
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={28} className="text-emerald-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-24 text-slate-600"
            >
              <MessageSquare size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No messages found</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <FeedbackCard
                    key={msg.id}
                    feedback={msg}
                    index={i}
                    selected={selected.includes(msg.id)}
                    onSelect={() => toggleSelect(msg.id)}
                    onView={() => setDetailModal(msg)}
                    onDelete={() => handleDelete(msg)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
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
              checked={
                selected.length === messages.length && messages.length > 0
              }
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
            />
            <span>Sender</span>
            <span className="hidden md:block">Subject</span>
            <span className="hidden lg:block">Date</span>
            <span className="hidden md:block">Preview</span>
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
                  <Loader2
                    size={28}
                    className="text-emerald-400 animate-spin"
                  />
                </motion.div>
              ) : messages.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-20 text-slate-600"
                >
                  <MessageSquare size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No messages found</p>
                </motion.div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors ${
                      selected.includes(msg.id) ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(msg.id)}
                      onChange={() => toggleSelect(msg.id)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-400">
                          {msg.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {msg.name}
                        </p>
                        <p className="text-slate-600 text-xs truncate">
                          {msg.email}
                        </p>
                      </div>
                    </div>
                    <p className="hidden md:block text-slate-500 text-xs truncate max-w-[140px]">
                      {msg.subject || "—"}
                    </p>
                    <p className="hidden lg:block text-slate-600 text-xs whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                    <p className="hidden md:block text-slate-700 text-xs truncate max-w-[160px]">
                      {msg.message?.slice(0, 50)}...
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailModal(msg)}
                        className="w-7 h-7 rounded-lg hover:bg-emerald-500/10 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(msg)}
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
      )}

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
