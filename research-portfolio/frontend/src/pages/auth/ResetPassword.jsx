// src/pages/auth/ResetPassword.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check,
  Lock,
  XCircle,
} from "lucide-react";
import { resetPasswordApi } from "../../api/authApi";

// ─── Animated background ──────────────────────────────────────────────────────
function Background() {
  const rings = [260, 400, 540, 680];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: "#080E1A" }} />

      {/* Pulsing rings — top right corner */}
      {rings.map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            right: -size / 4,
            top: -size / 4,
            border: "1px solid rgba(139,92,246,0.08)",
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 4 + i * 0.8,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Orbs */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-violet-600/7 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-700/6 blur-3xl" />

      {/* Particles */}
      {Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        y: 10 + Math.random() * 80,
        size: Math.random() * 2 + 0.5,
        dur: 11 + Math.random() * 9,
        delay: Math.random() * 5,
        op: Math.random() * 0.22 + 0.05,
      })).map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.op,
          }}
          animate={{ y: [0, -22, 0], opacity: [p.op, p.op * 3, p.op] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #6366F1, #3B82F6)",
            boxShadow: "0 0 16px rgba(124,58,237,0.4)",
          }}
        >
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 blur-md opacity-40" />
      </div>
      <span className="text-white font-semibold text-lg tracking-tight">
        ResearchPortfolio
      </span>
    </div>
  );
}

// ─── Floating label input ─────────────────────────────────────────────────────
function FloatingInput({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
  suffix,
  error,
  disabled,
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.length > 0);

  return (
    <div>
      <motion.div
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        <div
          className="relative rounded-xl transition-all duration-200"
          style={{
            background: "rgba(30,41,59,0.6)",
            border: `1px solid ${
              error
                ? "rgba(239,68,68,0.45)"
                : focused
                  ? "rgba(139,92,246,0.55)"
                  : "rgba(51,65,85,0.7)"
            }`,
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.08)" : "none",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <label
            htmlFor={id}
            className={`absolute left-4 pointer-events-none transition-all duration-200 font-medium ${
              active
                ? "top-2 text-[11px] text-violet-400"
                : "top-1/2 -translate-y-1/2 text-sm text-slate-500"
            }`}
          >
            {label}
          </label>
          <input
            id={id}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete={autoComplete}
            placeholder={active ? placeholder : ""}
            disabled={disabled}
            className={`w-full bg-transparent text-white text-sm focus:outline-none ${
              suffix ? "pr-11" : "pr-4"
            } ${active ? "pt-5 pb-2 px-4" : "py-3.5 px-4"}`}
          />
          {suffix && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
          >
            <AlertCircle size={11} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Password strength meter ──────────────────────────────────────────────────
function StrengthMeter({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const barColors = [
    "bg-slate-800",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const textColors = [
    "",
    "text-red-400",
    "text-amber-400",
    "text-blue-400",
    "text-emerald-400",
  ];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 space-y-2.5 overflow-hidden"
    >
      {/* Bar */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-400 ${
              i <= score ? barColors[score] : "bg-slate-800"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>

      {/* Requirement chips */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {checks.map((c) => (
            <motion.div
              key={c.label}
              className="flex items-center gap-1.5"
              animate={{ opacity: c.pass ? 1 : 0.4 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  c.pass
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : "bg-slate-800 border border-slate-700"
                }`}
              >
                {c.pass && (
                  <Check
                    size={8}
                    className="text-emerald-400"
                    strokeWidth={3}
                  />
                )}
              </div>
              <span className="text-[11px] text-slate-500">{c.label}</span>
            </motion.div>
          ))}
        </div>
        {score > 0 && (
          <span
            className={`text-xs font-semibold flex-shrink-0 ${textColors[score]}`}
          >
            {labels[score]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Countdown redirect ring ──────────────────────────────────────────────────
function CountdownRing({ seconds, total }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const progress = (seconds / total) * circ;

  return (
    <svg width="54" height="54" className="rotate-[-90deg]">
      <circle
        cx="27"
        cy="27"
        r={r}
        fill="none"
        stroke="rgba(99,102,241,0.12)"
        strokeWidth="3"
      />
      <motion.circle
        cx="27"
        cy="27"
        r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ - progress }}
        transition={{ duration: 0.8, ease: "linear" }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  const TOTAL = 3;
  const [seconds, setSeconds] = useState(TOTAL);
  const navigate = useNavigate();

  useEffect(() => {
    if (seconds <= 0) {
      navigate("/login");
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {/* Animated shield */}
      <div className="relative w-28 h-28 mx-auto mb-8">
        {/* Pulse rings */}
        {[1, 1.3, 1.6].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(16,185,129,0.2)" }}
            animate={{ scale: [1, scale, 1], opacity: [0.6, 0, 0.6] }}
            transition={{
              duration: 2.5,
              delay: i * 0.35,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
          className="relative w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <ShieldCheck
              size={44}
              className="text-emerald-400"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>

        {/* Orbiting checkmarks */}
        {[0, 120, 240].map((deg, i) => (
          <motion.div
            key={deg}
            className="absolute w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateX(54px)`,
              marginTop: -10,
              marginLeft: -10,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.4 + i * 0.12,
              type: "spring",
              stiffness: 300,
            }}
          >
            <Check size={9} className="text-emerald-400" strokeWidth={3} />
          </motion.div>
        ))}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-[1.75rem] font-bold text-white mb-2 tracking-tight"
      >
        Password updated!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-slate-400 text-sm mb-8"
      >
        Your password has been reset successfully.
      </motion.p>

      {/* Countdown + redirect */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <CountdownRing seconds={seconds} total={TOTAL} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{seconds}</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm">
          Redirecting to sign in{seconds === 1 ? "…" : ""}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Sign in now <ArrowRight size={14} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Invalid token screen ─────────────────────────────────────────────────────
function InvalidToken() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <div className="relative w-24 h-24 mx-auto mb-7">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
          Link expired or invalid
        </h2>
        <p className="text-slate-400 text-sm mb-7">
          This reset link has expired or is no longer valid. Request a new one
          below.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          Request new link <ArrowRight size={14} />
        </Link>
        <div className="mt-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.newPassword) errs.newPassword = "New password is required.";
    else if (form.newPassword.length < 8)
      errs.newPassword = "Must be at least 8 characters.";
    if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const data = await resetPasswordApi({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      if (data.success) setSuccess(true);
      else setError(data.message || "Reset failed.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Reset failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const passwordMismatch =
    form.confirmPassword.length > 0 &&
    form.confirmPassword !== form.newPassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Background />

      <div className="w-full max-w-[420px] relative z-10">
        <AnimatePresence mode="wait">
          {/* Invalid token */}
          {!token && <InvalidToken key="invalid" />}

          {/* Success */}
          {token && success && <SuccessScreen key="success" />}

          {/* Form */}
          {token && !success && (
            <motion.div
              key="form"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
                scale: 0.97,
                y: -16,
                transition: { duration: 0.25 },
              }}
            >
              {/* Logo */}
              <motion.div variants={itemVariants} className="mb-10">
                <Logo />
              </motion.div>

              {/* Heading */}
              <motion.div variants={itemVariants} className="mb-8">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.1,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.25)",
                  }}
                >
                  <Lock
                    size={22}
                    className="text-violet-400"
                    strokeWidth={1.5}
                  />
                </motion.div>
                <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                  Create new password
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Choose something strong and unique — you won't be able to
                  reuse your old password.
                </p>
              </motion.div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <AlertCircle
                        size={15}
                        className="text-red-400 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-red-400">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <motion.div variants={itemVariants}>
                  <FloatingInput
                    id="newPassword"
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    error={fieldErrors.newPassword}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                      >
                        <motion.div
                          key={showPassword ? "hide" : "show"}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </motion.div>
                      </button>
                    }
                  />

                  {/* Strength meter */}
                  <AnimatePresence>
                    {form.newPassword && (
                      <StrengthMeter password={form.newPassword} />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Confirm password */}
                <motion.div variants={itemVariants}>
                  <FloatingInput
                    id="confirmPassword"
                    label="Confirm new password"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    error={
                      fieldErrors.confirmPassword ||
                      (passwordMismatch ? "Passwords don't match." : "")
                    }
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}
                      >
                        <motion.div
                          key={showConfirm ? "hide" : "show"}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                        >
                          {showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </motion.div>
                      </button>
                    }
                  />

                  {/* Match indicator */}
                  <AnimatePresence>
                    {form.confirmPassword &&
                      form.confirmPassword === form.newPassword && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400"
                        >
                          <Check size={12} strokeWidth={2.5} />
                          Passwords match
                        </motion.div>
                      )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.015 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                    className="relative w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                    style={{
                      background:
                        "linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #3B82F6 100%)",
                      boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
                    }}
                  >
                    {/* Shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                    <span className="relative flex items-center justify-center gap-2">
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.span
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 size={16} className="animate-spin" />
                            Updating password…
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            Reset password
                            <ArrowRight
                              size={15}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                </motion.div>
              </form>

              {/* Back link */}
              <motion.div variants={itemVariants} className="mt-7 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors group"
                >
                  <ArrowLeft
                    size={14}
                    className="group-hover:-translate-x-0.5 transition-transform"
                  />
                  Back to sign in
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
