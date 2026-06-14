// src/pages/auth/Signup.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { signupApi } from "../../api/authApi";

// ─── Re-usable particle background (same as Login) ───────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 14 + 10,
    delay: Math.random() * 6,
    opacity: Math.random() * 0.3 + 0.06,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -28, 0],
            opacity: [p.opacity, p.opacity * 2.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
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
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative">
      <motion.div
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
      >
        <div
          className="relative rounded-xl transition-all duration-200"
          style={{
            background: "rgba(30,41,59,0.7)",
            border: `1px solid ${
              error
                ? "rgba(239,68,68,0.4)"
                : focused
                  ? "rgba(139,92,246,0.5)"
                  : "rgba(51,65,85,0.8)"
            }`,
            boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.08)" : "none",
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
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = [
    "bg-slate-700",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const textColors = [
    "",
    "text-red-400",
    "text-amber-400",
    "text-blue-400",
    "text-emerald-400",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 space-y-3 overflow-hidden"
    >
      {/* Bar */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-400 ${
              i <= score ? colors[score] : "bg-slate-800"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: "left" }}
          />
        ))}
      </div>

      {/* Label + checks */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {checks.map((c) => (
            <motion.div
              key={c.label}
              className="flex items-center gap-1.5"
              animate={{ opacity: c.pass ? 1 : 0.45 }}
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
            className={`text-xs font-medium flex-shrink-0 mt-0.5 ${textColors[score]}`}
          >
            {labels[score]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Feature list item for left panel ────────────────────────────────────────
function Feature({ text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3"
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <Check size={10} className="text-violet-400" strokeWidth={2.5} />
      </div>
      <span className="text-slate-400 text-[14px] leading-snug">{text}</span>
    </motion.div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
function SuccessScreen({ email }) {
  return (
    <div className="min-h-screen bg-[#080E1A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Animated check circle */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2 tracking-tight"
        >
          Check your email
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="text-slate-400 text-sm leading-relaxed mb-8"
        >
          We sent a verification link to{" "}
          <span className="text-white font-medium">{email}</span>.
          <br />
          Click the link to activate your account.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
            }}
          >
            Go to sign in <ArrowRight size={14} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Signup() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8)
      errs.password = "Must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords don't match.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await signupApi({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Signup failed.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  if (success) return <SuccessScreen email={form.email} />;

  const formVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.075, delayChildren: 0.1 } },
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
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password;

  return (
    <div className="min-h-screen bg-[#080E1A] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden">
        <ParticleField />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-bold text-base">R</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 blur-md opacity-40" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            ResearchPortfolio
          </span>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-px bg-violet-500" />
            <span className="text-violet-400 text-xs font-medium uppercase tracking-widest">
              Join the team
            </span>
          </div>
          <h1 className="text-[2.6rem] font-bold text-white leading-[1.15] tracking-tight mb-5">
            Join a community
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #60A5FA 100%)",
              }}
            >
              of researchers
            </span>
            <br />& builders.
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-xs">
            Create your account to explore projects, publications, and connect
            with the research team.
          </p>
        </motion.div>

        {/* Feature list */}
        <div className="space-y-3.5 relative">
          <Feature text="Explore cutting-edge research projects" delay={0.3} />
          <Feature text="Access publications & achievements" delay={0.38} />
          <Feature
            text="Connect with the research team directly"
            delay={0.46}
          />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-violet-900/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-900/15 blur-3xl" />
        </div>

        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-[420px] relative"
        >
          {/* Mobile logo */}
          <motion.div
            variants={itemVariants}
            className="flex lg:hidden items-center gap-3 mb-10"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40" />
            </div>
            <span className="text-white font-semibold text-lg">
              ResearchPortfolio
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
              Create account
            </h2>
            <p className="text-slate-400 text-sm">
              Start your research journey today
            </p>
          </motion.div>

          {/* Error */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants}>
              <FloatingInput
                id="name"
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="John Doe"
                error={fieldErrors.name}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                error={fieldErrors.email}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={fieldErrors.password}
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
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.div>
                  </button>
                }
              />
              {/* Password strength */}
              <AnimatePresence>
                {form.password && <StrengthMeter password={form.password} />}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FloatingInput
                id="confirmPassword"
                label="Confirm password"
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
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.div>
                  </button>
                }
              />
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
                        <Loader2 size={16} className="animate-spin" /> Creating
                        account…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        Create account
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

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 my-6"
          >
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(51,65,85,0.6)" }}
            />
            <span className="text-slate-600 text-xs">or continue with</span>
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(51,65,85,0.6)" }}
            />
          </motion.div>

          {/* Google */}
          <motion.div variants={itemVariants}>
            <motion.button
              onClick={handleGoogleSignup}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl text-slate-300 text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200"
              style={{
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(51,65,85,0.8)",
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </motion.button>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-center text-slate-600 text-sm mt-7"
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
