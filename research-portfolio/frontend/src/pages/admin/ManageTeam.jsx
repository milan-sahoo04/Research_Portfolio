// src/pages/admin/ManageTeam.jsx
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
  Users,
  Mail,
  BookOpen,
  Award,
  Calendar,
  Filter,
  Code2,
  Link,
  AtSign,
} from "lucide-react";
// At the top, add this import instead:
import {
  getTeamStatsApi,
  getAllTeamAdminApi,
  createTeamMemberApi,
  updateTeamMemberApi,
  deleteTeamMemberApi,
  bulkDeleteTeamApi,
  toggleTeamFeaturedApi,
} from "../../api/adminApi";

// ─── Role config ──────────────────────────────────────────
const ROLES = ["Researcher", "Faculty", "Student"];
const ROLE_COLORS = {
  Researcher: {
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    border: "border-violet-500/20",
  },
  Faculty: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Student: {
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
};

// ─── Shared Toast ─────────────────────────────────────────
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

// ─── Field helper (module-level, no remount) ──────────────
function Field({
  label,
  name,
  type = "text",
  options,
  rows,
  form,
  onChange,
  placeholder,
}) {
  const base =
    "w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all";
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
            className={`${base} appearance-none`}
          >
            <option value="">— Select —</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
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

// ─── Member Modal ─────────────────────────────────────────
function MemberModal({ member, onClose, onSave }) {
  const isEdit = !!member?.id;
  const [form, setForm] = useState({
    name: member?.name || "",
    role: member?.role || "",
    email: member?.email || "",
    bio: member?.bio || "",
    expertise: (member?.expertise || []).join(", "),
    publications: member?.publications ?? "",
    citations: member?.citations ?? "",
    join_year: member?.join_year || "",
    featured: member?.featured || false,
    github: member?.socials?.github || "",
    linkedin: member?.socials?.linkedin || "",
    twitter: member?.socials?.twitter || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(member?.profile_pic || null);
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

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    const r = new FileReader();
    r.onload = (e) => setImagePreview(e.target.result);
    r.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (form.role) fd.append("role", form.role);
      if (form.email) fd.append("email", form.email.trim());
      if (form.bio) fd.append("bio", form.bio.trim());
      if (form.expertise) fd.append("expertise", form.expertise);
      if (form.publications !== "")
        fd.append("publications", form.publications);
      if (form.citations !== "") fd.append("citations", form.citations);
      if (form.join_year) fd.append("join_year", form.join_year);
      fd.append("featured", form.featured);
      // Socials as JSON
      const socials = {};
      if (form.github) socials.github = form.github.trim();
      if (form.linkedin) socials.linkedin = form.linkedin.trim();
      if (form.twitter) socials.twitter = form.twitter.trim();
      if (Object.keys(socials).length)
        fd.append("socials", JSON.stringify(socials));
      if (imageFile) fd.append("profile_pic", imageFile);

      const res = isEdit
        ? await updateTeamMemberApi(member.id, fd)
        : await createTeamMemberApi(fd);
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                {isEdit ? (
                  <Edit3 size={14} className="text-white" />
                ) : (
                  <Plus size={14} className="text-white" />
                )}
              </div>
              <h3 className="text-white font-semibold text-base">
                {isEdit ? "Edit Member" : "Add Team Member"}
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
            {/* Photo upload */}
            <div className="flex items-center gap-5">
              <div
                className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-[#1E293B] cursor-pointer group flex-shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1">
                    <Upload size={18} />
                    <span className="text-[10px]">Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImage(e.target.files[0])}
              />
              <div className="flex-1 space-y-2">
                <Field
                  label="Name *"
                  name="name"
                  form={form}
                  onChange={handleChange}
                  placeholder="Dr. Jane Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Role"
                name="role"
                form={form}
                onChange={handleChange}
                options={ROLES}
              />
              <Field
                label="Join Year"
                name="join_year"
                form={form}
                onChange={handleChange}
                placeholder="2022"
              />
            </div>

            <Field
              label="Email"
              name="email"
              type="email"
              form={form}
              onChange={handleChange}
              placeholder="jane@university.edu"
            />
            <Field
              label="Bio"
              name="bio"
              form={form}
              onChange={handleChange}
              rows={3}
              placeholder="Research interests, background..."
            />
            <Field
              label="Expertise (comma separated)"
              name="expertise"
              form={form}
              onChange={handleChange}
              placeholder="Machine Learning, NLP, Computer Vision"
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Publications"
                name="publications"
                type="number"
                form={form}
                onChange={handleChange}
                placeholder="0"
              />
              <Field
                label="Citations"
                name="citations"
                type="number"
                form={form}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            {/* Socials */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Socials
              </p>
              <div className="space-y-2">
                {[
                  {
                    key: "github",
                    icon: Code2,
                    ph: "https://github.com/username",
                  },
                  {
                    key: "linkedin",
                    icon: Link,
                    ph: "https://linkedin.com/in/username",
                  },
                  {
                    key: "twitter",
                    icon: AtSign,
                    ph: "https://twitter.com/username",
                  },
                ].map(({ key, icon: Icon, ph }) => (
                  <div key={key} className="relative">
                    <Icon
                      size={13}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="url"
                      value={form[key]}
                      placeholder={ph}
                      onChange={handleChange(key)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

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
              <span className="text-sm text-slate-300">Featured member</span>
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
              disabled={saving || !form.name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Member Card (grid view) ──────────────────────────────
function MemberCard({
  member,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onToggleFeatured,
}) {
  const rc = ROLE_COLORS[member.role] || ROLE_COLORS.Researcher;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl border overflow-hidden transition-all cursor-pointer group
        ${selected ? "border-indigo-500/50 bg-indigo-500/5" : "border-[#1E293B] hover:border-[#2D3F55]"}`}
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
          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Featured star */}
      <button
        onClick={onToggleFeatured}
        className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-colors
          ${member.featured ? "bg-amber-500/20 text-amber-400" : "bg-black/30 text-slate-600 opacity-0 group-hover:opacity-100"}`}
      >
        <Star size={13} fill={member.featured ? "currentColor" : "none"} />
      </button>

      {/* Photo */}
      <div className="pt-8 pb-4 px-4 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#1E293B]">
          {member.profile_pic ? (
            <img
              src={member.profile_pic}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-400">
                {member.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm truncate max-w-[160px]">
            {member.name}
          </p>
          {member.role && (
            <span
              className={`text-xs px-2 py-0.5 rounded-lg font-medium ${rc.bg} ${rc.text} border ${rc.border}`}
            >
              {member.role}
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-px border-t border-[#1E293B]">
        {[
          { icon: BookOpen, label: "Pubs", value: member.publications ?? "—" },
          { icon: Award, label: "Cites", value: member.citations ?? "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-2.5 gap-0.5"
          >
            <Icon size={11} className="text-slate-600" />
            <p className="text-white text-xs font-bold">{value}</p>
            <p className="text-slate-600 text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex border-t border-[#1E293B]">
        <button
          onClick={onEdit}
          className="flex-1 py-2 text-xs text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-colors flex items-center justify-center gap-1"
        >
          <Edit3 size={11} /> Edit
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
export default function ManageTeam() {
  const [members, setMembers] = useState([]);
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
  const [selected, setSelected] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
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
      const r = await getTeamStatsApi();
      if (r.success) setStats(r.data);
    } catch {}
  }, []);

  const fetchMembers = useCallback(
    async (pg = 1, q = search, role = roleFilter) => {
      setLoading(true);
      try {
        const r = await getAllTeamAdminApi({
          page: pg,
          limit: 20,
          search: q,
          role,
        });
        if (r.success) {
          setMembers(r.data);
          setPagination(r.pagination);
        }
      } catch {
        addToast("Failed to load team members.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, addToast],
  );

  const fetchMembersRef = useRef(fetchMembers);
  const fetchStatsRef = useRef(fetchStats);
  useEffect(() => {
    fetchMembersRef.current = fetchMembers;
  }, [fetchMembers]);
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    Promise.all([fetchMembersRef.current(page), fetchStatsRef.current()]);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    fetchMembersRef.current(page);
  }, [page, roleFilter]); // eslint-disable-line

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      fetchMembersRef.current(1, v);
    }, 400);
  };

  const handleDelete = (m) => {
    setConfirm({
      open: true,
      title: "Delete Member",
      message: `Delete "${m.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await deleteTeamMemberApi(m.id);
          if (r.success) {
            fetchMembersRef.current(page);
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
      message: `Delete ${selected.length} member(s)?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const r = await bulkDeleteTeamApi(selected);
          if (r.success) {
            setSelected([]);
            fetchMembersRef.current(page);
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

  const handleToggleFeatured = async (m) => {
    try {
      const r = await toggleTeamFeaturedApi(m.id);
      if (r.success) {
        setMembers((p) =>
          p.map((x) =>
            x.id === m.id ? { ...x, featured: r.data.featured } : x,
          ),
        );
        addToast(r.message);
      }
    } catch {
      addToast("Failed.", "error");
    }
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) setMembers((p) => p.map((x) => (x.id === data.id ? data : x)));
    else {
      fetchMembersRef.current(page);
      fetchStatsRef.current();
    }
    setModal(null);
    addToast(isEdit ? "Member updated." : "Member added.");
  };

  const toggleSelect = (id) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () =>
    setSelected(
      selected.length === members.length ? [] : members.map((m) => m.id),
    );

  const STAT_CARDS = [
    { label: "Total", value: stats?.total, color: "from-cyan-500 to-blue-600" },
    {
      label: "Featured",
      value: stats?.featured,
      color: "from-amber-500 to-orange-600",
    },
    {
      label: "Researchers",
      value: stats?.byRole?.Researcher,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Faculty",
      value: stats?.byRole?.Faculty,
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} />

      {modal && (
        <MemberModal
          member={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      <ConfirmModal
        {...confirm}
        loading={actionLoading}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pagination.total} members · {stats?.featured ?? 0} featured
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
                className={`px-3 py-2 text-xs font-medium transition-colors capitalize
                  ${view === v ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              fetchMembersRef.current(page);
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            <Plus size={15} /> Add Member
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
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

      {/* ── Filters ── */}
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
            placeholder="Search members..."
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
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>
        {/* Select all */}
        {members.length > 0 && (
          <button
            onClick={toggleAll}
            className="px-4 py-2.5 rounded-xl text-sm border border-[#1E293B] text-slate-400 hover:bg-white/5 transition-colors"
          >
            {selected.length === members.length ? "Deselect All" : "Select All"}
          </button>
        )}
      </motion.div>

      {/* ── Grid View ── */}
      {view === "grid" && (
        <div>
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-24 text-slate-600"
            >
              <Users size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No members found</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              <AnimatePresence>
                {members.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    selected={selected.includes(m.id)}
                    onSelect={() => toggleSelect(m.id)}
                    onEdit={() => setModal(m)}
                    onDelete={() => handleDelete(m)}
                    onToggleFeatured={() => handleToggleFeatured(m)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {view === "table" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#1E293B] overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
          }}
        >
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#1E293B] text-xs font-bold uppercase tracking-widest text-slate-600">
            <input
              type="checkbox"
              checked={selected.length === members.length && members.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
            <span>Member</span>
            <span className="hidden md:block">Role</span>
            <span className="hidden lg:block">Pubs</span>
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
                  className="flex justify-center py-20"
                >
                  <Loader2 size={28} className="text-cyan-400 animate-spin" />
                </motion.div>
              ) : members.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-20 text-slate-600"
                >
                  <Users size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No members found</p>
                </motion.div>
              ) : (
                members.map((m, i) => {
                  const rc = ROLE_COLORS[m.role] || ROLE_COLORS.Researcher;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors
                      ${selected.includes(m.id) ? "bg-cyan-500/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                          {m.profile_pic ? (
                            <img
                              src={m.profile_pic}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center">
                              <span className="text-sm font-bold text-cyan-400">
                                {m.name?.[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {m.name}
                          </p>
                          <p className="text-slate-600 text-xs truncate">
                            {m.email || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        {m.role ? (
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${rc.bg} ${rc.text} border ${rc.border}`}
                          >
                            {m.role}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </div>
                      <p className="hidden lg:block text-slate-600 text-xs">
                        {m.publications ?? "—"}
                      </p>
                      <p className="hidden lg:block text-slate-600 text-xs">
                        {m.join_year || "—"}
                      </p>
                      <button
                        onClick={() => handleToggleFeatured(m)}
                        className={`hidden md:flex items-center gap-1 text-xs transition-colors
                        ${m.featured ? "text-amber-400" : "text-slate-700 hover:text-slate-500"}`}
                      >
                        <Star
                          size={14}
                          fill={m.featured ? "currentColor" : "none"}
                        />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal(m)}
                          className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Pagination ── */}
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
