// src/components/home/FeaturedProjects.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";

const ACCENTS = [
  {
    from: "#6366f1",
    to: "#818cf8",
    glow: "rgba(99,102,241,0.14)",
    border: "rgba(99,102,241,0.3)",
    badge: "rgba(99,102,241,0.12)",
    badgeText: "#a5b4fc",
  },
  {
    from: "#3b82f6",
    to: "#60a5fa",
    glow: "rgba(59,130,246,0.14)",
    border: "rgba(59,130,246,0.3)",
    badge: "rgba(59,130,246,0.12)",
    badgeText: "#93c5fd",
  },
  {
    from: "#8b5cf6",
    to: "#a78bfa",
    glow: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.3)",
    badge: "rgba(139,92,246,0.12)",
    badgeText: "#c4b5fd",
  },
];

const FALLBACK = [
  {
    id: "1",
    title: "Neural Architecture Search",
    category: "AI",
    description:
      "Automated discovery of optimal neural network architectures using reinforcement learning and evolutionary algorithms.",
    tags: ["PyTorch", "RL", "NAS"],
  },
  {
    id: "2",
    title: "Multimodal Language Models",
    category: "ML",
    description:
      "Bridging vision and language understanding through unified transformer architectures trained on diverse datasets.",
    tags: ["Transformers", "Vision", "NLP"],
  },
  {
    id: "3",
    title: "Federated Learning Platform",
    category: "Research",
    description:
      "Privacy-preserving distributed machine learning enabling collaboration without sharing sensitive data.",
    tags: ["Privacy", "Distributed", "FL"],
  },
];

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    axios
      .get("/projects?limit=3&sort=createdAt&order=desc")
      .then((res) => {
        if (res?.data?.success) setProjects(res.data.data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const display = projects.length ? projects : FALLBACK;

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
        >
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#a5b4fc",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Featured Work
            </div>
            <h2
              className="text-3xl md:text-5xl font-black tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Latest Research{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Projects
              </span>
            </h2>
          </div>

          <Link
            to="/projects"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:gap-3 self-start md:self-auto"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#a5b4fc",
            }}
          >
            View all projects
            <ChevronRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </motion.div>

        {/* Project cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {display.map((project, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            const isHovered = hovered === i;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered(null)}
                className="group relative flex flex-col rounded-2xl overflow-hidden cursor-default"
                style={{
                  background: "var(--bg-card, rgba(255,255,255,0.03))",
                  border: `1px solid ${
                    isHovered ? accent.border : "rgba(255,255,255,0.07)"
                  }`,
                  transition: "border-color 0.35s ease, box-shadow 0.35s ease",
                  boxShadow: isHovered
                    ? `0 20px 60px ${accent.glow}, 0 0 0 1px ${accent.border}`
                    : "none",
                }}
              >
                {/* Gradient top bar */}
                <div
                  className="h-0.5 w-full transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                    opacity: isHovered ? 1 : 0.4,
                  }}
                />

                {/* Glow background */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: `radial-gradient(ellipse at top, ${accent.glow} 0%, transparent 60%)`,
                      }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 flex flex-col flex-1 p-6">
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{
                        background: accent.badge,
                        color: accent.badgeText,
                        border: `1px solid ${accent.border}`,
                      }}
                    >
                      {project.category}
                    </span>

                    {/* Index indicator */}
                    <span
                      className="text-xs font-black tabular-nums"
                      style={{ color: "rgba(255,255,255,0.1)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-bold mb-3 leading-snug transition-colors duration-300"
                    style={{
                      color: isHovered
                        ? accent.from
                        : "var(--text-primary, #f1f5f9)",
                    }}
                  >
                    {project.title}
                  </h3>

                  <p
                    className="text-sm leading-relaxed flex-1 mb-5"
                    style={{ color: "var(--text-muted, #64748b)" }}
                  >
                    {project.description?.slice(0, 120)}
                    {project.description?.length > 120 ? "…" : ""}
                  </p>

                  {/* Tags */}
                  {project.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "var(--text-muted, #94a3b8)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/projects/${project.id}`}
                    className="group/link flex items-center gap-2 text-sm font-bold transition-all duration-200"
                    style={{ color: accent.from }}
                  >
                    View project
                    <ExternalLink
                      size={13}
                      className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200"
                    />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
