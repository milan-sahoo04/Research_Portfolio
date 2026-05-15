import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

// ─── Animated loading screen shown while session is being verified ───────────
const AuthLoadingScreen = () => {
  const pulseVariants = {
    animate: {
      scale: [1, 1.15, 1],
      opacity: [0.4, 1, 0.4],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const ringVariants = {
    animate: {
      rotate: 360,
      transition: { duration: 2.4, repeat: Infinity, ease: "linear" },
    },
  };

  const dotVariants = {
    animate: (i) => ({
      y: [0, -10, 0],
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 0.9,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.18,
      },
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 z-10">
        {/* Spinning rings + core icon */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#3B82F6",
              borderRightColor: "#6366F1",
            }}
            variants={ringVariants}
            animate="animate"
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-transparent"
            style={{ borderBottomColor: "#10B981", borderLeftColor: "#06B6D4" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          />
          {/* Core pulse */}
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
            variants={pulseVariants}
            animate="animate"
          >
            {/* Shield icon */}
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </motion.div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-white font-semibold text-base tracking-wide mb-1">
            Verifying Access
          </p>
          <p className="text-gray-500 text-sm">
            Checking your admin credentials...
          </p>
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              custom={i}
              variants={dotVariants}
              animate="animate"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Unauthorized screen shown briefly before redirecting ────────────────────
const UnauthorizedScreen = ({ countdown }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-red-950/20 to-gray-900">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />

    <motion.div
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Lock icon with shake */}
      <motion.div
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/20 flex items-center justify-center"
        animate={{ x: [0, -8, 8, -5, 5, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <svg
          className="w-9 h-9 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          You don't have permission to view this page. Admin credentials are
          required.
        </p>
      </div>

      {/* Countdown badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <p className="text-gray-300 text-sm">
          Redirecting to login in{" "}
          <span className="text-white font-bold text-base">{countdown}s</span>
        </p>
      </div>

      {/* Progress bar */}
      <motion.div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3, ease: "linear" }}
        />
      </motion.div>
    </motion.div>
  </div>
);

// ─── AdminRoute — main guard component ──────────────────────────────────────
const AdminRoute = () => {
  const location = useLocation();
  const [authState, setAuthState] = useState("loading"); // "loading" | "authorized" | "unauthorized"
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session) {
          setAuthState("unauthorized");
          return;
        }

        // ── Optional: check if user has admin role in your DB ──────────
        // If you store roles in a `profiles` table or user_metadata:
        const isAdmin =
          session.user?.user_metadata?.role === "admin" ||
          session.user?.app_metadata?.role === "admin" ||
          // Fallback: any authenticated user is treated as admin
          // Remove this line if you want strict role-based access:
          !!session.user;

        setAuthState(isAdmin ? "authorized" : "unauthorized");
      } catch (err) {
        console.error("AdminRoute auth check failed:", err);
        if (mounted) setAuthState("unauthorized");
      }
    };

    checkSession();

    // Listen for auth state changes (logout from another tab, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setAuthState("unauthorized");
      } else {
        const isAdmin =
          session.user?.user_metadata?.role === "admin" ||
          session.user?.app_metadata?.role === "admin" ||
          !!session.user;
        setAuthState(isAdmin ? "authorized" : "unauthorized");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Countdown timer before redirect
  useEffect(() => {
    if (authState !== "unauthorized") return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [authState, countdown]);

  // ── Render states ──────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {authState === "loading" && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AuthLoadingScreen />
        </motion.div>
      )}

      {authState === "unauthorized" && countdown > 0 && (
        <motion.div
          key="unauthorized"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <UnauthorizedScreen countdown={countdown} />
        </motion.div>
      )}

      {authState === "unauthorized" && countdown <= 0 && (
        <Navigate
          key="redirect"
          to="/admin/login"
          state={{
            from: location,
            message: "Please log in to access the admin panel.",
          }}
          replace
        />
      )}

      {authState === "authorized" && (
        <motion.div
          key="authorized"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          <Outlet />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminRoute;
