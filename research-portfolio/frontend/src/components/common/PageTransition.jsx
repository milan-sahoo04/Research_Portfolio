import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

// ─── Transition Presets ────────────────────────────────────────────────────────
const presets = {
  // Default: elegant vertical rise
  rise: {
    initial: { opacity: 0, y: 24, filter: "blur(4px)" },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
      opacity: 0,
      y: -12,
      filter: "blur(2px)",
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
    },
  },

  // Slide from right (for forward navigation)
  slideRight: {
    initial: { opacity: 0, x: 40, filter: "blur(3px)" },
    animate: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
      opacity: 0,
      x: -24,
      filter: "blur(2px)",
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  },

  // Scale + fade (for modal-like pages)
  scale: {
    initial: { opacity: 0, scale: 0.97, filter: "blur(3px)" },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      filter: "blur(2px)",
      transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
    },
  },
};

// ─── Route → Preset Map ────────────────────────────────────────────────────────
// Customize which routes use which transition
function getPreset(pathname) {
  if (pathname.startsWith("/admin")) return presets.slideRight;
  if (
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/project/") ||
    pathname.startsWith("/publication/")
  )
    return presets.scale;
  return presets.rise;
}

// ─── Thin Progress Bar (top of page) ──────────────────────────────────────────
function RouteProgressBar() {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[9999]"
      style={{ height: 2 }}
      initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
      animate={{ scaleX: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        style={{
          height: "100%",
          background: "linear-gradient(90deg, #818CF8, #C084FC, #F472B6)",
        }}
      />
      {/* Glow tip */}
      <motion.div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 80,
          height: 6,
          background:
            "radial-gradient(ellipse at right, rgba(244,114,182,0.6), transparent)",
          filter: "blur(3px)",
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
    </motion.div>
  );
}

// ─── Page Transition ───────────────────────────────────────────────────────────
function PageTransition({ children, showProgress = true }) {
  const location = useLocation();
  const preset = getPreset(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={preset}
      >
        {/* Top progress bar fires on every route change */}
        {showProgress && (
          <AnimatePresence>
            <RouteProgressBar key={`bar-${location.pathname}`} />
          </AnimatePresence>
        )}

        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
