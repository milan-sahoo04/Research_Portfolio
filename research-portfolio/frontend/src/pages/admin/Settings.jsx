// src/pages/admin/Settings.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  FileText,
  Save,
  AlertTriangle,
  Trash2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

// ─── API helpers (inline, no extra adminApi functions needed) ─────────────────
const getMyProfileApi = () => axios.get("/users/me").then((r) => r.data);
const updateProfileApi = (data) =>
  axios.put("/users/me", data).then((r) => r.data);
const uploadAvatarApi = (file) => {
  const fd = new FormData();
  fd.append("profile_pic", file);
  return axios
    .post("/users/me/profile-pic", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
const deleteAvatarApi = () =>
  axios.delete("/users/me/profile-pic").then((r) => r.data);
const changePasswordApi = (data) =>
  axios.put("/auth/change-password", data).then((r) => r.data);

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
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium pointer-events-auto border backdrop-blur-xl
              ${
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

// ─── Section card wrapper ─────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  accent = "indigo",
  children,
  action,
}) {
  const accents = {
    indigo: {
      grad: "from-indigo-500 to-blue-600",
      glow: "shadow-indigo-500/10",
    },
    cyan: { grad: "from-cyan-500 to-teal-600", glow: "shadow-cyan-500/10" },
    amber: {
      grad: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/10",
    },
    rose: { grad: "from-rose-500 to-red-600", glow: "shadow-rose-500/10" },
    emerald: {
      grad: "from-emerald-500 to-green-600",
      glow: "shadow-emerald-500/10",
    },
  };
  const a = accents[accent] || accents.indigo;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-[#1E293B] overflow-hidden shadow-xl ${a.glow}`}
      style={{ background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-lg`}
          >
            <Icon size={15} className="text-white" />
          </div>
          <h2 className="text-white font-semibold text-sm">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

// ─── Input field ──────────────────────────────────────────
function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  icon: Icon,
  suffix,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
        )}
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${isPassword || suffix ? "pr-10" : "pr-4"}
            py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm
            focus:outline-none focus:border-indigo-500/50 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-600`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {suffix && !isPassword && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function Settings() {
  const { user: authUser, updateUser: updateAuthUser, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPass, setSavingPass] = useState(false);
  const [passStrength, setPassStrength] = useState(0);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const fileRef = useRef(null);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Load profile ───────────────────────────────────────
  useEffect(() => {
    getMyProfileApi()
      .then((r) => {
        if (r.success) {
          setProfile(r.data);
          setProfileForm({
            name: r.data.name || "",
            bio: r.data.bio || "",
            phone: r.data.phone || "",
          });
          setAvatarPreview(r.data.profile_pic || null);
        }
      })
      .catch(() => addToast("Failed to load profile.", "error"))
      .finally(() => setLoadingProfile(false));
  }, []); // eslint-disable-line

  // ── Password strength ──────────────────────────────────
  useEffect(() => {
    const p = passForm.newPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    setPassStrength(score);
  }, [passForm.newPassword]);

  // ── Handlers ───────────────────────────────────────────
  const onProfileChange = (e) =>
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onPassChange = (e) =>
    setPassForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      addToast("Name is required.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const r = await updateProfileApi(profileForm);
      if (r.success) {
        setProfile((p) => ({ ...p, ...r.data }));
        if (updateAuthUser) updateAuthUser(r.data);
        addToast("Profile updated successfully.");
      } else {
        addToast(r.message || "Update failed.", "error");
      }
    } catch (e) {
      addToast(e?.response?.data?.message || "Update failed.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (file) => {
    if (!file) return;
    // Preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const r = await uploadAvatarApi(file);
      if (r.success) {
        setProfile((p) => ({ ...p, profile_pic: r.profile_pic }));
        setAvatarPreview(r.profile_pic);
        if (updateAuthUser) updateAuthUser({ profile_pic: r.profile_pic });
        addToast("Profile picture updated.");
      }
    } catch (e) {
      addToast(e?.response?.data?.message || "Upload failed.", "error");
      setAvatarPreview(profile?.profile_pic || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.profile_pic) return;
    setDeletingAvatar(true);
    try {
      const r = await deleteAvatarApi();
      if (r.success) {
        setProfile((p) => ({ ...p, profile_pic: null }));
        setAvatarPreview(null);
        if (updateAuthUser) updateAuthUser({ profile_pic: null });
        addToast("Profile picture removed.");
      }
    } catch (e) {
      addToast(e?.response?.data?.message || "Remove failed.", "error");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passForm;
    if (!currentPassword) {
      addToast("Current password is required.", "error");
      return;
    }
    if (newPassword.length < 8) {
      addToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }
    setSavingPass(true);
    try {
      const r = await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (r.success) {
        addToast("Password changed. Please log in again.");
        setPassForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => logout?.(), 2000);
      } else {
        addToast(r.message || "Password change failed.", "error");
      }
    } catch (e) {
      addToast(
        e?.response?.data?.message || "Password change failed.",
        "error",
      );
    } finally {
      setSavingPass(false);
    }
  };

  const strengthConfig = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-500" },
    { label: "Good", color: "bg-yellow-500" },
    { label: "Strong", color: "bg-emerald-500" },
    { label: "Very Strong", color: "bg-emerald-400" },
  ];
  const sc = strengthConfig[passStrength] || strengthConfig[0];

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast toasts={toasts} />

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* ── Account info banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/20"
        style={{
          background:
            "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(59,130,246,0.06))",
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">
            {profile?.name}
          </p>
          <p className="text-slate-500 text-xs truncate">
            {profile?.email} ·{" "}
            <span className="capitalize">{profile?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          {profile?.is_verified ? "Verified" : "Unverified"}
        </div>
      </motion.div>

      {/* ── Profile Picture ── */}
      <SectionCard title="Profile Picture" icon={Camera} accent="cyan">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[#1E293B]">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-blue-600/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-indigo-400">
                    {profile?.name?.[0]?.toUpperCase() || "A"}
                  </span>
                </div>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <Loader2 size={18} className="text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-slate-400 text-sm">
              JPG, PNG, or WebP · Max 5 MB
            </p>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-teal-600 text-white disabled:opacity-60 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Camera size={13} /> Upload Photo
              </motion.button>
              {profile?.profile_pic && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteAvatar}
                  disabled={deletingAvatar}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:text-red-400 hover:border-red-500/30 disabled:opacity-60 transition-all"
                >
                  {deletingAvatar ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  Remove
                </motion.button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarChange(e.target.files[0])}
          />
        </div>
      </SectionCard>

      {/* ── Profile Info ── */}
      <SectionCard
        title="Profile Information"
        icon={User}
        accent="indigo"
        action={
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 text-white disabled:opacity-60 shadow-lg shadow-indigo-500/20 transition-all"
          >
            {savingProfile ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            {savingProfile ? "Saving…" : "Save"}
          </motion.button>
        }
      >
        <div className="space-y-4">
          <InputField
            label="Display Name"
            name="name"
            value={profileForm.name}
            onChange={onProfileChange}
            placeholder="Your full name"
            icon={User}
          />

          <InputField
            label="Email"
            name="email"
            type="email"
            value={profile?.email || ""}
            disabled
            placeholder="Email address"
            icon={Mail}
            suffix="Read-only"
          />

          <InputField
            label="Phone"
            name="phone"
            type="tel"
            value={profileForm.phone}
            onChange={onProfileChange}
            placeholder="+1 (555) 000-0000"
            icon={Phone}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              value={profileForm.bio}
              onChange={onProfileChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all resize-none placeholder-slate-600"
            />
            <p className="text-slate-600 text-xs mt-1 text-right">
              {profileForm.bio.length}/500
            </p>
          </div>

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1E293B]">
            {[
              { label: "Role", value: profile?.role },
              {
                label: "Status",
                value: profile?.is_active ? "Active" : "Inactive",
              },
              { label: "Verified", value: profile?.is_verified ? "Yes" : "No" },
              {
                label: "Member Since",
                value: profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-600 uppercase tracking-widest mb-0.5">
                  {label}
                </p>
                <p className="text-sm text-slate-300 capitalize">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Change Password ── */}
      <SectionCard
        title="Change Password"
        icon={Lock}
        accent="amber"
        action={
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleChangePassword}
            disabled={savingPass}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white disabled:opacity-60 shadow-lg shadow-amber-500/20 transition-all"
          >
            {savingPass ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Lock size={13} />
            )}
            {savingPass ? "Updating…" : "Update"}
          </motion.button>
        }
      >
        <div className="space-y-4">
          <InputField
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passForm.currentPassword}
            onChange={onPassChange}
            placeholder="Enter current password"
          />

          <InputField
            label="New Password"
            name="newPassword"
            type="password"
            value={passForm.newPassword}
            onChange={onPassChange}
            placeholder="At least 8 characters"
          />

          {/* Strength bar */}
          {passForm.newPassword && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300
                      ${i < passStrength ? sc.color : "bg-[#1E293B]"}`}
                  />
                ))}
              </div>
              <p
                className={`text-xs font-medium ${
                  passStrength <= 1
                    ? "text-red-400"
                    : passStrength === 2
                      ? "text-yellow-400"
                      : "text-emerald-400"
                }`}
              >
                {sc.label}
              </p>
            </div>
          )}

          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passForm.confirmPassword}
            onChange={onPassChange}
            placeholder="Repeat new password"
          />

          {/* Match indicator */}
          {passForm.confirmPassword && passForm.newPassword && (
            <div
              className={`flex items-center gap-2 text-xs font-medium
              ${passForm.newPassword === passForm.confirmPassword ? "text-emerald-400" : "text-red-400"}`}
            >
              {passForm.newPassword === passForm.confirmPassword ? (
                <>
                  <CheckCircle size={13} /> Passwords match
                </>
              ) : (
                <>
                  <XCircle size={13} /> Passwords do not match
                </>
              )}
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
            <AlertTriangle
              size={14}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-200/70">
              Changing your password will log you out of all sessions. You'll
              need to sign in again.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Danger zone ── */}
      <SectionCard title="Session" icon={LogOut} accent="rose">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white text-sm font-medium">Sign out</p>
            <p className="text-slate-500 text-xs mt-0.5">
              End your current session on this device
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => logout?.()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#1E293B] text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            <LogOut size={14} /> Sign out
          </motion.button>
        </div>
      </SectionCard>
    </div>
  );
}
