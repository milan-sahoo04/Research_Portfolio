// src/components/common/ThemeToggle.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={toggleTheme}
        className={`relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden transition-colors duration-200 ${className}`}
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.1)"}`,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Glow ring on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: isDark
                  ? "0 0 12px rgba(99,102,241,0.35)"
                  : "0 0 12px rgba(245,158,11,0.35)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Background fill that transitions */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            background: isDark
              ? "rgba(99,102,241,0.08)"
              : "rgba(245,158,11,0.08)",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Icon swap with morph animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: isDark ? 90 : -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: isDark ? -90 : 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            {isDark ? (
              <Moon size={16} className="text-indigo-400" />
            ) : (
              <Sun size={16} className="text-amber-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 whitespace-nowrap pointer-events-none z-50"
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(51,65,85,0.6)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {isDark ? "Light mode" : "Dark mode"}
            {/* Arrow */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: "rgba(15,23,42,0.95)",
                borderTop: "1px solid rgba(51,65,85,0.6)",
                borderLeft: "1px solid rgba(51,65,85,0.6)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThemeToggle;
