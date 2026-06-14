// src/pages/public/ProjectDetails.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  Calendar,
  Star,
  GitFork,
  Tag,
  Loader2,
  FolderOpen,
} from "lucide-react";
import axios from "../../api/axios";

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

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    axios
      .get(`/projects/${id}`)
      .then((res) => {
        if (res.data?.success) {
          setProject(res.data.data);
          if (res.data.related) setRelated(res.data.related);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        className="min-h-screen pt-24 pb-16 flex items-center justify-center"
        style={{ background: "var(--bg-primary, #0f172a)" }}
      >
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: "#818cf8" }}
        />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center text-center px-4"
        style={{ background: "var(--bg-primary, #0f172a)" }}
      >
        <FolderOpen size={48} style={{ color: "#475569" }} className="mb-4" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#f8fafc" }}>
          Project not found
        </h1>
        <p className="mb-6" style={{ color: "#64748b" }}>
          The project you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/projects"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#818cf8",
          }}
        >
          <ArrowLeft size={15} /> Back to Projects
        </Link>
      </div>
    );
  }

  const color = COLORS[(project.title?.length || 0) % COLORS.length];

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="container-custom px-4 max-w-5xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
            style={{ color: "#64748b" }}
          >
            <ArrowLeft size={15} /> Back to Projects
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {project.category && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                }}
              >
                {project.category.replace("_", " ")}
              </span>
            )}
            {project.status && (
              <span
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={
                  project.status === "Completed"
                    ? {
                        background: "rgba(16,185,129,0.15)",
                        color: "#34d399",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }
                    : {
                        background: "rgba(14,165,233,0.15)",
                        color: "#38bdf8",
                        border: "1px solid rgba(14,165,233,0.2)",
                      }
                }
              >
                {project.status}
              </span>
            )}
            {project.year && (
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "#64748b" }}
              >
                <Calendar size={13} /> {project.year}
              </span>
            )}
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{ color: "#f8fafc" }}
          >
            {project.title}
          </h1>

          <p
            className="text-base md:text-lg max-w-3xl"
            style={{ color: "#94a3b8" }}
          >
            {project.description}
          </p>
        </motion.div>

        {/* Cover Image */}
        {project.image && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl overflow-hidden mb-10"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-auto object-cover max-h-[420px]"
            />
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="md:col-span-2 space-y-8"
          >
            {/* Tags */}
            {project.tags?.length > 0 && (
              <div>
                <h2
                  className="text-sm font-bold uppercase tracking-widest mb-3"
                  style={{ color: "#475569" }}
                >
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#94a3b8",
                      }}
                    >
                      <Tag size={12} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full description / overview */}
            <div>
              <h2
                className="text-sm font-bold uppercase tracking-widest mb-3"
                style={{ color: "#475569" }}
              >
                Overview
              </h2>
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: "#94a3b8" }}
              >
                {project.description}
              </p>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: "#475569" }}
              >
                Project Info
              </h3>

              <div className="space-y-3 text-sm">
                {project.status && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#64748b" }}>Status</span>
                    <span style={{ color: "#f1f5f9" }}>{project.status}</span>
                  </div>
                )}
                {project.year && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#64748b" }}>Year</span>
                    <span style={{ color: "#f1f5f9" }}>{project.year}</span>
                  </div>
                )}
                {project.category && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#64748b" }}>Category</span>
                    <span
                      style={{ color: "#f1f5f9", textTransform: "capitalize" }}
                    >
                      {project.category.replace("_", " ")}
                    </span>
                  </div>
                )}
                {(project.stars || project.forks) && (
                  <div
                    className="flex items-center gap-4 pt-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {project.stars != null && (
                      <span
                        className="flex items-center gap-1.5"
                        style={{ color: "#fbbf24" }}
                      >
                        <Star size={14} fill="currentColor" /> {project.stars}
                      </span>
                    )}
                    {project.forks != null && (
                      <span
                        className="flex items-center gap-1.5"
                        style={{ color: "#94a3b8" }}
                      >
                        <GitFork size={14} /> {project.forks}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                    }}
                  >
                    Live Demo <ExternalLink size={14} />
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#f1f5f9",
                    }}
                  >
                    <Code2 size={14} /> View Source
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Projects */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-16"
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "#f8fafc" }}>
              Related Projects
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((p, i) => {
                const c = COLORS[i % COLORS.length];
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="group flex flex-col rounded-2xl p-5 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      className="self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
                      style={{
                        background: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      {p.category}
                    </span>
                    <h3
                      className="font-semibold mb-1 group-hover:text-indigo-400 transition-colors"
                      style={{ color: "#f1f5f9" }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {p.description?.slice(0, 80)}...
                    </p>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
