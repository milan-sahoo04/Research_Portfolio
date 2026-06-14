import { motion, AnimatePresence } from "framer-motion";

// ─── Orbital Loader ────────────────────────────────────────────────────────────
function OrbitalLoader({ size = "md" }) {
  const config = {
    sm: { outer: 32, inner: 20, dot: 4, orbit: 10 },
    md: { outer: 52, inner: 34, dot: 6, orbit: 16 },
    lg: { outer: 76, inner: 50, dot: 9, orbit: 23 },
  }[size];

  return (
    <div
      style={{ width: config.outer, height: config.outer }}
      className="relative flex items-center justify-center"
    >
      {/* Outer orbital ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1.5px solid transparent`,
          borderTopColor: "#818CF8",
          borderRightColor: "rgba(129,140,248,0.4)",
          borderBottomColor: "rgba(129,140,248,0.1)",
          borderLeftColor: "rgba(129,140,248,0.25)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner counter-rotating ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.inner,
          height: config.inner,
          border: `1.5px solid transparent`,
          borderTopColor: "#C084FC",
          borderLeftColor: "rgba(192,132,252,0.35)",
          borderBottomColor: "rgba(192,132,252,0.1)",
          borderRightColor: "transparent",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
      />

      {/* Core pulse */}
      <motion.div
        className="rounded-full"
        style={{
          width: config.dot,
          height: config.dot,
          background: "linear-gradient(135deg, #818CF8, #C084FC)",
        }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbiting dot */}
      <motion.div
        className="absolute"
        style={{ width: config.outer, height: config.outer }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: config.dot - 1,
            height: config.dot - 1,
            background: "#F472B6",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px rgba(244,114,182,0.7)",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Morphing Dots ─────────────────────────────────────────────────────────────
export function MorphingDots({ color = "#818CF8" }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 6, height: 6, background: color, opacity: 0.3 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scaleY: [1, 1.8, 1],
            scaleX: [1, 0.7, 1],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Progress Bar Loader ────────────────────────────────────────────────────────
export function ProgressLoader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center gap-3 w-40">
      <div
        className="w-full h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(129,140,248,0.15)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #818CF8, #C084FC, #F472B6)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p
        className="text-xs tracking-widest uppercase"
        style={{ color: "var(--text-muted)", letterSpacing: "0.12em" }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Shimmer Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className = "", lines = 1, animate = true }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg"
          style={{
            height: 16,
            width: i === lines - 1 && lines > 1 ? "68%" : "100%",
            background: "var(--bg-tertiary, rgba(99,102,241,0.06))",
          }}
        >
          {animate && (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.12) 50%, transparent 100%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Card Skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="premium-card p-6 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          {/* Image placeholder */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              height: 176,
              background: "var(--bg-tertiary, rgba(99,102,241,0.05))",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(129,140,248,0.1) 50%, transparent 70%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.2,
              }}
            />
          </div>

          {/* Text lines */}
          <Skeleton lines={3} />

          {/* Tags */}
          <div className="flex gap-2">
            {[60, 72].map((w, j) => (
              <div
                key={j}
                className="relative overflow-hidden rounded-full"
                style={{
                  height: 24,
                  width: w,
                  background: "var(--bg-tertiary, rgba(99,102,241,0.06))",
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(129,140,248,0.1), transparent)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "linear",
                    delay: j * 0.15,
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Full-screen Overlay Loader ────────────────────────────────────────────────
function FullScreenLoader() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: "var(--bg-primary)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Ambient glow behind spinner */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative flex flex-col items-center gap-8">
        <OrbitalLoader size="lg" />
        <ProgressLoader label="Loading" />
      </div>
    </motion.div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
function Loader({ fullScreen = false, size = "md" }) {
  if (fullScreen) {
    return (
      <AnimatePresence>
        <FullScreenLoader />
      </AnimatePresence>
    );
  }

  return <OrbitalLoader size={size} />;
}

export default Loader;
