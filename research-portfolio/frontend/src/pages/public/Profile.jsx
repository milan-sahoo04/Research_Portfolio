// src/pages/public/Profile.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Trash2,
  Save,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Calendar,
  Clock,
  Edit3,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMyProfileApi,
  updateMyProfileApi,
  uploadMyProfilePicApi,
  deleteMyProfilePicApi,
} from "../../api/userApi";
import { changePasswordApi } from "../../api/authApi";

// ─── Toast ───────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium pointer-events-auto ${
              t.type === "success"
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                : "bg-red-500/20 border border-red-500/40 text-red-300"
            }`}
            style={{ backdropFilter: "blur(16px)" }}
          >
            {t.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Avatar Upload Zone ───────────────────────────────────
function AvatarZone({ user, onUpload, onDelete, uploading }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    onUpload(file);
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className={`relative w-32 h-32 rounded-3xl cursor-pointer group transition-all duration-300 ${
          drag ? "scale-105 ring-4 ring-indigo-500/60" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Avatar */}
        {preview || user?.profile_pic ? (
          <img
            src={preview || user.profile_pic}
            alt={user?.name}
            className="w-32 h-32 rounded-3xl object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <Camera size={24} className="text-white" />
          )}
        </div>

        {/* Online badge */}
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0B1120]" />
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <p className="mt-3 text-xs text-slate-500">
        Click or drag to upload · Max 5MB
      </p>

      {(user?.profile_pic || preview) && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onDelete();
          }}
          className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={12} /> Remove photo
        </motion.button>
      )}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────
function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  maxLength,
  hint,
}) {
  return (
    <div className="group">
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
          <Icon size={15} />
        </div>
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={3}
            className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#1E293B] rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none disabled:opacity-50"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#1E293B] rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
          />
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────
function Card({ title, icon: Icon, accent = "indigo", children, action }) {
  const accents = {
    indigo: "from-indigo-500 to-blue-600",
    purple: "from-purple-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    red: "from-red-500 to-rose-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#1E293B] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #0B1120 100%)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center`}
          >
            <Icon size={15} className="text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// ─── Password Section ─────────────────────────────────────
function PasswordSection({ addToast }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const pw = form.newPassword;
  const str = strength(pw);
  const strColors = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];
  const strLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword)
      return addToast("All fields are required.", "error");
    if (form.newPassword !== form.confirmPassword)
      return addToast("Passwords do not match.", "error");
    if (str < 2) return addToast("Password is too weak.", "error");
    setLoading(true);
    try {
      await changePasswordApi(form);
      addToast("Password changed successfully.", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      addToast(
        e?.response?.data?.message || "Failed to change password.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const PwField = ({ field, label, showKey }) => (
    <div className="group">
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
        />
        <input
          type={show[showKey] ? "text" : "password"}
          value={form[field]}
          onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
          placeholder="••••••••"
          className="w-full pl-10 pr-10 py-3 bg-[#111827] border border-[#1E293B] rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((p) => ({ ...p, [showKey]: !p[showKey] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <Card title="Change Password" icon={Lock} accent="purple">
      <div className="space-y-4">
        <PwField
          field="currentPassword"
          label="Current Password"
          showKey="current"
        />
        <PwField field="newPassword" label="New Password" showKey="new" />

        {pw && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <div className="flex gap-1.5 mb-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= str ? strColors[str] : "bg-[#1E293B]"}`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">{strLabels[str]}</p>
          </motion.div>
        )}

        <PwField
          field="confirmPassword"
          label="Confirm New Password"
          showKey="confirm"
        />

        <motion.button
          onClick={handleSubmit}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Lock size={15} />
          )}
          {loading ? "Updating..." : "Update Password"}
        </motion.button>
      </div>
    </Card>
  );
}

// ─── Main Profile Page ────────────────────────────────────
export default function Profile() {
  const { user: authUser, login, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", phone: "" });

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    getMyProfileApi()
      .then((res) => {
        if (res.success) {
          setProfile(res.data);
          setForm({
            name: res.data.name || "",
            bio: res.data.bio || "",
            phone: res.data.phone || "",
          });
        }
      })
      .catch(() => addToast("Failed to load profile.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateMyProfileApi(form);
      if (res.success) {
        setProfile((p) => ({ ...p, ...res.data }));
        login({ ...authUser, ...res.data }, token);
        addToast("Profile updated successfully.");
        setEditing(false);
      }
    } catch (e) {
      addToast(e?.response?.data?.message || "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadMyProfilePicApi(file);
      if (res.success) {
        setProfile((p) => ({ ...p, profile_pic: res.profile_pic }));
        login({ ...authUser, profile_pic: res.profile_pic }, token);
        addToast("Photo updated.");
      }
    } catch (e) {
      addToast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePic = async () => {
    try {
      await deleteMyProfilePicApi();
      setProfile((p) => ({ ...p, profile_pic: null }));
      login({ ...authUser, profile_pic: null }, token);
      addToast("Photo removed.");
    } catch {
      addToast("Failed to remove photo.", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-400 animate-spin" />
      </div>
    );

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";
  const lastSeen = profile?.last_login
    ? new Date(profile.last_login).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-[#0B1120] py-10 px-4">
      <Toast toasts={toasts} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage your personal information
            </p>
          </div>
          {!editing ? (
            <motion.button
              onClick={() => setEditing(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              <Edit3 size={14} /> Edit Profile
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setEditing(false)}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:bg-white/5 transition-colors"
              >
                <X size={14} /> Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Top Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#1E293B] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #0B1120 100%)",
          }}
        >
          <div className="h-24 bg-gradient-to-r from-indigo-600/30 via-purple-600/20 to-blue-600/30 relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.1) 0%, transparent 60%)",
              }}
            />
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4 flex-wrap gap-4">
              <AvatarZone
                user={profile}
                onUpload={handleUpload}
                onDelete={handleDeletePic}
                uploading={uploading}
              />
              <div className="flex items-center gap-4 flex-wrap">
                {[
                  { icon: Calendar, label: "Joined", value: joined },
                  { icon: Clock, label: "Last seen", value: lastSeen },
                  {
                    icon: Shield,
                    label: "Role",
                    value:
                      profile?.role === "admin" ? "Administrator" : "Member",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-0.5">
                      <Icon size={11} /> {label}
                    </div>
                    <p className="text-white text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white">
                  {profile?.name}
                </h2>
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
                {profile?.role === "admin" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{profile?.email}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Card */}
          <Card title="Personal Information" icon={User} accent="indigo">
            <div className="space-y-4">
              <Field
                icon={User}
                label="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Your name"
                disabled={!editing}
                maxLength={100}
              />
              <Field
                icon={Mail}
                label="Email Address"
                value={profile?.email || ""}
                onChange={() => {}}
                placeholder="Email"
                disabled={true}
                hint="Email cannot be changed here."
              />
              <Field
                icon={Phone}
                label="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 (555) 000-0000"
                disabled={!editing}
              />
              <Field
                icon={FileText}
                label="Bio"
                value={form.bio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bio: e.target.value }))
                }
                type="textarea"
                placeholder="Tell us a little about yourself..."
                disabled={!editing}
                maxLength={500}
                hint={editing ? `${form.bio.length}/500 characters` : ""}
              />
            </div>
          </Card>

          <div className="space-y-6">
            {/* Account Status */}
            <Card title="Account Status" icon={Shield} accent="emerald">
              <div className="space-y-3">
                {[
                  {
                    label: "Email Verified",
                    value: profile?.is_verified,
                    yes: "Verified",
                    no: "Not Verified",
                  },
                  {
                    label: "Account Active",
                    value: profile?.is_active,
                    yes: "Active",
                    no: "Inactive",
                  },
                ].map(({ label, value, yes, no }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-[#1E293B] last:border-0"
                  >
                    <span className="text-slate-400 text-sm">{label}</span>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        value
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {value ? (
                        <CheckCircle size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {value ? yes : no}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 text-sm">Member Since</span>
                  <span className="text-white text-sm font-medium">
                    {joined}
                  </span>
                </div>
              </div>
            </Card>

            {/* Password */}
            <PasswordSection addToast={addToast} />
          </div>
        </div>
      </div>
    </div>
  );
}
