// src/pages/public/Achievements.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Star } from "lucide-react";
import axios from "../../api/axios";
import { ACHIEVEMENT_TYPES } from "../../utils/constants";

const TYPE_ICONS = {
  Award: "🏆",
  Patent: "📜",
  Certification: "🎖",
  Grant: "💰",
  Publication: "📄",
};
const TYPE_COLORS = {
  Award: {
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    text: "#fbbf24",
  },
  Patent: {
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.25)",
    text: "#818cf8",
  },
  Certification: {
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    text: "#34d399",
  },
  Grant: {
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    text: "#60a5fa",
  },
  Publication: {
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    text: "#a78bfa",
  },
};

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    axios
      .get("/achievements?limit=30")
      .then((res) => {
        if (res.data?.success) setAchievements(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? achievements
      : achievements.filter((a) => a.type === filter);

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="container-custom px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#6366f1" }}
          >
            Recognition
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mt-2 mb-4"
            style={{ color: "#f8fafc" }}
          >
            Achievements
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Awards, patents, certifications, and milestones that mark our
            journey.
          </p>
        </motion.div>

        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {["All", ...ACHIEVEMENT_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  filter === t
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === t ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: filter === t ? "#818cf8" : "#64748b",
              }}
            >
              {TYPE_ICONS[t] || "🏅"} {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#475569" }}>
            No achievements found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((item, i) => {
              const color = TYPE_COLORS[item.type] || TYPE_COLORS.Award;
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="flex gap-4 p-5 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: color.bg,
                      border: `1px solid ${color.border}`,
                    }}
                  >
                    {TYPE_ICONS[item.type] || "🏅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold" style={{ color: "#f1f5f9" }}>
                        {item.title}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm mb-2" style={{ color: "#64748b" }}>
                        {item.description?.slice(0, 100)}
                      </p>
                    )}
                    {item.year && (
                      <p className="text-xs" style={{ color: "#475569" }}>
                        📅 {item.year}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
