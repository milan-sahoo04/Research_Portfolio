import { motion } from "framer-motion";

function Loader({ fullScreen = false, size = "md" }) {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-9 h-9 border-2",
    lg: "w-14 h-14 border-3",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      {/* Outer ring */}
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full border-transparent`}
          style={{
            borderTopColor: "#6366F1",
            borderRightColor: "rgba(99,102,241,0.3)",
            borderBottomColor: "rgba(99,102,241,0.1)",
            borderLeftColor: "rgba(99,102,241,0.2)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>

      {fullScreen && (
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: "var(--bg-primary)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {spinner}
        </motion.div>
      </div>
    );
  }

  return spinner;
}

/* Skeleton loader */
export function Skeleton({ className = "", lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded-lg h-4"
          style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}

/* Card skeleton */
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="premium-card p-6 space-y-4">
          <div className="animate-shimmer rounded-xl h-44 w-full" />
          <div className="space-y-2">
            <div className="animate-shimmer rounded h-5 w-3/4" />
            <div className="animate-shimmer rounded h-4 w-full" />
            <div className="animate-shimmer rounded h-4 w-5/6" />
          </div>
          <div className="flex gap-2">
            <div className="animate-shimmer rounded-full h-6 w-16" />
            <div className="animate-shimmer rounded-full h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Loader;
