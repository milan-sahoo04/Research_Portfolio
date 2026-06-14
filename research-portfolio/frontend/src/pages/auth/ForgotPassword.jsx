// src/pages/auth/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { forgotPasswordApi } from "../../api/authApi";

// ─── Animated background ──────────────────────────────────────────────────────
function Background() {
  const rings = [280, 420, 560, 700];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0" style={{ background: "#080E1A" }} />

      {/* Pulsing concentric rings centered bottom-left */}
      {rings.map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: -size / 4,
            bottom: -size / 4,
            border: "1px solid rgba(99,102,241,0.08)",
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

      {/* Ambient orbs */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full bg-blue-700/6 blur-3xl" />

      {/* Floating particles */}
      {Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 80,
        size: Math.random() * 2 + 0.6,
        dur: 10 + Math.random() * 10,
        delay: Math.random() * 5,
        op: Math.random() * 0.25 + 0.05,
      })).map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.op,
          }}
          animate={{ y: [0, -24, 0], opacity: [p.op, p.op * 3, p.op] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
    </div>
  );
}

// ─── Logo mark ────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)",
            boxShadow: "0 0 16px rgba(99,102,241,0.4)",
          }}
        >
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 blur-md opacity-40" />
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
  value,
  onChange,
  placeholder,
  error,
  disabled,
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

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
                  ? "rgba(99,102,241,0.55)"
                  : "rgba(51,65,85,0.7)"
            }`,
            boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.08)" : "none",
          }}
        >
          <label
            htmlFor={id}
            className={`absolute left-4 pointer-events-none transition-all duration-200 font-medium ${
              active
                ? "top-2 text-[11px] text-indigo-400"
                : "top-1/2 -translate-y-1/2 text-sm text-slate-500"
            }`}
          >
            {label}
          </label>
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={active ? placeholder : ""}
            disabled={disabled}
            autoComplete={type === "email" ? "email" : "off"}
            className={`w-full bg-transparent text-white text-sm focus:outline-none pr-4 disabled:opacity-40 ${
              active ? "pt-5 pb-2 px-4" : "py-3.5 px-4"
            }`}
          />
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

// ─── Animated email icon ──────────────────────────────────────────────────────
function EmailSentIcon() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-8">
      {/* Pulsing outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: "1px solid rgba(59,130,246,0.3)" }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: "1px solid rgba(59,130,246,0.2)" }}
        animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
        transition={{
          duration: 2.5,
          delay: 0.4,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Icon circle */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Send size={34} className="text-blue-400" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Floating dots around the icon */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={deg}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
          style={{
            top: "50%",
            left: "50%",
            transform: `rotate(${deg}deg) translateX(46px)`,
            marginTop: -3,
            marginLeft: -3,
            opacity: 0,
          }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
          transition={{
            delay: 0.3 + i * 0.1,
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Email address is required.");
    setLoading(true);
    setError("");
    try {
      const data = await forgotPasswordApi(email);
      if (data.success) setSent(true);
      else setError(data.message || "Something went wrong.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Request failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Background />

      <div className="w-full max-w-[420px] relative z-10">
        <AnimatePresence mode="wait">
          {/* ── SENT STATE ── */}
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <EmailSentIcon />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.25,
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <h2 className="text-[1.75rem] font-bold text-white mb-3 tracking-tight">
                  Check your inbox
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">
                  If{" "}
                  <span
                    className="font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "#93C5FD",
                    }}
                  >
                    {email}
                  </span>{" "}
                  is registered, a reset link is on its way.
                </p>
                <p className="text-slate-600 text-xs mb-8">
                  The link expires in 1 hour. Check your spam folder if you
                  don't see it.
                </p>

                {/* Steps */}
                <div
                  className="rounded-xl p-4 mb-8 text-left space-y-3"
                  style={{
                    background: "rgba(30,41,59,0.5)",
                    border: "1px solid rgba(51,65,85,0.5)",
                  }}
                >
                  {[
                    { n: "1", text: "Open the email from ResearchPortfolio" },
                    { n: "2", text: "Click the reset link inside" },
                    { n: "3", text: "Create your new password" },
                  ].map((step, i) => (
                    <motion.div
                      key={step.n}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.4 + i * 0.1,
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          background: "rgba(99,102,241,0.2)",
                          color: "#A5B4FC",
                        }}
                      >
                        {step.n}
                      </div>
                      <span className="text-slate-400 text-sm">
                        {step.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            /* ── FORM STATE ── */
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
                {/* Icon */}
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
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                  }}
                >
                  <Mail
                    size={22}
                    className="text-indigo-400"
                    strokeWidth={1.5}
                  />
                </motion.div>

                <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                  Forgot password?
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No worries. Enter your email and we'll send you a reset link
                  right away.
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

              {/* Form */}
              <motion.div variants={itemVariants}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FloatingInput
                    id="email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    error={error && !email ? error : ""}
                  />

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.015 } : {}}
                    whileTap={!loading ? { scale: 0.985 } : {}}
                    className="relative w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                      boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
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
                            Sending link…
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            Send reset link
                            <ArrowRight
                              size={15}
                              className="group-hover:translate-x-0.5 transition-transform"
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                </form>
              </motion.div>

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
