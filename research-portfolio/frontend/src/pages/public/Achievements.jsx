// src/pages/public/Achievements.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Calendar, Building2 } from "lucide-react";
import axios from "../../api/axios";
import { ACHIEVEMENT_TYPES } from "../../utils/constants";

const TYPE_ICONS = {
  Award: "🏆",
  Patent: "📜",
  Fellowship: "🎓",
  Grant: "💰",
  Certification: "🎖",
  Recognition: "⭐",
  Other: "🏅",
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
  Fellowship: {
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
    text: "#c084fc",
  },
  Grant: {
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    text: "#34d399",
  },
  Certification: {
    bg: "rgba(56,189,248,0.1)",
    border: "rgba(56,189,248,0.25)",
    text: "#38bdf8",
  },
  Recognition: {
    bg: "rgba(244,63,94,0.1)",
    border: "rgba(244,63,94,0.25)",
    text: "#fb7185",
  },
  Other: {
    bg: "rgba(100,116,139,0.1)",
    border: "rgba(100,116,139,0.25)",
    text: "#94a3b8",
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

        {/* Filter chips */}
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
                className="h-44 rounded-2xl animate-pulse"
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
              const color = TYPE_COLORS[item.type] || TYPE_COLORS.Other;
              return (
                <motion.div
                  key={item.id}
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
                  {/* Image or icon */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="flex-shrink-0 w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: color.bg,
                        border: `1px solid ${color.border}`,
                      }}
                    >
                      {TYPE_ICONS[item.type] || "🏅"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold" style={{ color: "#f1f5f9" }}>
                        {item.title}
                      </h3>
                      {item.type && (
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
                      )}
                    </div>

                    {item.description && (
                      <p
                        className="text-sm mb-2 leading-relaxed"
                        style={{ color: "#64748b" }}
                      >
                        {item.description?.slice(0, 140)}
                        {item.description?.length > 140 ? "..." : ""}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              color: "#94a3b8",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta row */}
                    <div
                      className="flex items-center gap-4 flex-wrap text-xs"
                      style={{ color: "#475569" }}
                    >
                      {item.issuer && (
                        <span className="flex items-center gap-1.5">
                          <Building2 size={11} /> {item.issuer}
                        </span>
                      )}
                      {item.year && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} /> {item.year}
                        </span>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                          style={{ color: "#818cf8" }}
                        >
                          <ExternalLink size={11} /> View
                        </a>
                      )}
                      {item.pdf_url && (
                        <a
                          href={item.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                          style={{ color: "#34d399" }}
                        >
                          <FileText size={11} /> PDF
                        </a>
                      )}
                    </div>
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
