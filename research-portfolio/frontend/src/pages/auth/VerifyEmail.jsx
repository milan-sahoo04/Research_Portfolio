// src/pages/auth/VerifyEmail.jsx
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  MailCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Animated background particles (same as Login) ───────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 14 + 10,
    delay: Math.random() * 6,
    opacity: Math.random() * 0.35 + 0.08,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
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
      <div className="absolute top-1/4 -left-24 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-blue-600/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-600/6 blur-3xl" />
    </div>
  );
}

// ─── Status = "verifying" | "success" | "already_verified" | "error" ─────────
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | already_verified | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "No verification token found in the link. Please check your email again.",
      );
      return;
    }

    fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          // Backend returns same success for both "just verified" and "already verified"
          if (data.message?.toLowerCase().includes("already")) {
            setStatus("already_verified");
          } else {
            setStatus("success");
          }
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(
            data.message || "Verification failed. The link may have expired.",
          );
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not reach the server. Please try again.");
      });
  }, [searchParams]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-[#080E1A] flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden">
        <ParticleField />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-base">R</span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 blur-md opacity-40" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            ResearchPortfolio
          </span>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-px bg-indigo-500" />
            <span className="text-indigo-400 text-xs font-medium uppercase tracking-widest">
              Account Setup
            </span>
          </div>
          <h1 className="text-[2.6rem] font-bold text-white leading-[1.15] tracking-tight mb-5">
            One step away
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #60A5FA 0%, #818CF8 50%, #A78BFA 100%)",
              }}
            >
              from your research
            </span>
            <br />
            portal.
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-xs">
            Confirming your email keeps your account secure and your research
            profile verifiable.
          </p>
        </motion.div>

        {/* Bottom spacer to match Login layout */}
        <div className="relative flex gap-10 opacity-0 pointer-events-none select-none">
          <div className="text-2xl font-bold text-white">—</div>
        </div>
      </div>

      {/* ── Right panel: status card ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-indigo-900/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-900/15 blur-3xl" />
        </div>

        <motion.div
          variants={containerVariants}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-md opacity-40" />
            </div>
            <span className="text-white font-semibold text-lg">
              ResearchPortfolio
            </span>
          </motion.div>

          {/* Icon + heading */}
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <AnimatePresence mode="wait">
              {status === "verifying" && (
                <motion.div
                  key="verifying-icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    <Loader2
                      size={28}
                      className="text-indigo-400 animate-spin"
                    />
                  </div>
                </motion.div>
              )}
              {status === "success" && (
                <motion.div
                  key="success-icon"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                    }}
                  >
                    <CheckCircle2 size={28} className="text-green-400" />
                  </div>
                </motion.div>
              )}
              {status === "already_verified" && (
                <motion.div
                  key="already-icon"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    <MailCheck size={28} className="text-indigo-400" />
                  </div>
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  key="error-icon"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <XCircle size={28} className="text-red-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {status === "verifying" && (
                <motion.div
                  key="verifying-text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                    Verifying your email
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Please wait a moment…
                  </p>
                </motion.div>
              )}
              {status === "success" && (
                <motion.div
                  key="success-text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                    Email verified!
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Your account is active. You can sign in now.
                  </p>
                </motion.div>
              )}
              {status === "already_verified" && (
                <motion.div
                  key="already-text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                    Already verified
                  </h2>
                  <p className="text-slate-400 text-sm">
                    This email was verified before. Go ahead and sign in.
                  </p>
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  key="error-text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-[1.75rem] font-bold text-white mb-1.5 tracking-tight">
                    Verification failed
                  </h2>
                  <p className="text-slate-400 text-sm">{message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Message banner (success / error) */}
          <AnimatePresence>
            {(status === "success" || status === "already_verified") && (
              <motion.div
                key="success-banner"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <CheckCircle2
                    size={15}
                    className="text-green-400 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-green-400">{message}</span>
                </div>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                key="error-banner"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <XCircle
                    size={15}
                    className="text-red-400 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-red-400">{message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA buttons */}
          <AnimatePresence>
            {(status === "success" || status === "already_verified") && (
              <motion.div
                key="success-cta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="relative w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden group flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                      boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center gap-2">
                      Sign in to your account
                      <ArrowRight
                        size={15}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error-cta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="space-y-3"
              >
                {/* Re-signup if token expired */}
                <Link to="/signup">
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="relative w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden group flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
                      boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    <span className="relative flex items-center gap-2">
                      Create a new account
                      <ArrowRight
                        size={15}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </span>
                  </motion.div>
                </Link>

                <Link to="/login">
                  <motion.div
                    whileHover={{
                      scale: 1.01,
                      borderColor: "rgba(99,102,241,0.4)",
                    }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 rounded-xl text-slate-300 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-3"
                    style={{
                      background: "rgba(30,41,59,0.5)",
                      border: "1px solid rgba(51,65,85,0.8)",
                    }}
                  >
                    Back to sign in
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          {status !== "verifying" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-slate-600 text-sm mt-7"
            >
              Need help?{" "}
              <Link
                to="/contact"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Contact support
              </Link>
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
