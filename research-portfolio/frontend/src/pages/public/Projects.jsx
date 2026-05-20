// src/pages/public/Projects.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { PROJECT_CATEGORIES } from "../../utils/constants";

const COLORS = [
  {
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.25)",
    text: "#818cf8",
  },
  {
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    text: "#60a5fa",
  },
  {
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    text: "#a78bfa",
  },
  {
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    text: "#34d399",
  },
  {
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    text: "#fbbf24",
  },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    axios
      .get("/projects?limit=30")
      .then((res) => {
        if (res.data?.success) setProjects(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

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
            Our Work
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mt-2 mb-4"
            style={{ color: "#f8fafc" }}
          >
            Research Projects
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Explore our ongoing and completed research initiatives.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "#475569" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f1f5f9",
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background:
                    category === c
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${category === c ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: category === c ? "#818cf8" : "#64748b",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#475569" }}>
            No projects found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project, i) => {
              const color = COLORS[i % COLORS.length];
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -5 }}
                  className="group relative flex flex-col rounded-2xl p-6"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span
                    className="self-start text-xs font-semibold px-3 py-1 rounded-full mb-4"
                    style={{
                      background: color.bg,
                      color: color.text,
                      border: `1px solid ${color.border}`,
                    }}
                  >
                    {project.category}
                  </span>
                  <h3
                    className="font-bold mb-2 group-hover:text-indigo-400 transition-colors"
                    style={{ color: "#f1f5f9" }}
                  >
                    {project.title}
                  </h3>
                  <p
                    className="text-sm flex-1 mb-5"
                    style={{ color: "#64748b" }}
                  >
                    {project.description?.slice(0, 110)}...
                  </p>
                  {project.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-md"
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
                  <Link
                    to={`/projects/${project._id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: color.text }}
                  >
                    View project <ExternalLink size={13} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
