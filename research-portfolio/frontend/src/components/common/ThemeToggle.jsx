import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${className}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        border: "1px solid var(--border)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {isDark ? (
          <Moon size={17} className="text-indigo-400" />
        ) : (
          <Sun size={17} className="text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  );
}

export default ThemeToggle;
