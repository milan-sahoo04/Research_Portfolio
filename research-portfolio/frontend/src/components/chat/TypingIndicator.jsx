// src/components/chat/TypingIndicator.jsx
import { motion } from "framer-motion";

export default function TypingIndicator({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-end gap-2 px-4 py-1"
    >
      {/* Avatar placeholder */}
      <div
        className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-black mb-1"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
      >
        {name?.[0]?.toUpperCase() || "U"}
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-bl-md"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Name */}
        <span className="text-[11px] font-medium" style={{ color: "#475569" }}>
          {name?.split(" ")[0]} is typing
        </span>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block rounded-full"
              style={{
                width: 5,
                height: 5,
                background:
                  i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : "#a5b4fc",
              }}
              animate={{
                y: [0, -5, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.14,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
