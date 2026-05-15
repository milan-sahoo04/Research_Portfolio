import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGithub,
  FiExternalLink,
  FiCode,
  FiStar,
  FiGitBranch,
  FiEye,
  FiArrowUpRight,
  FiTag,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

// ─────────────────────────────────────────────
// TECH COLOR MAP — badge accent per technology
// ─────────────────────────────────────────────
const TECH_COLORS = {
  // Languages
  python: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/25",
  },
  javascript: {
    bg: "bg-yellow-400/15",
    text: "text-yellow-300",
    border: "border-yellow-400/25",
  },
  typescript: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/25",
  },
  rust: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/25",
  },
  go: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
  },
  java: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/25",
  },
  cpp: {
    bg: "bg-blue-600/15",
    text: "text-blue-300",
    border: "border-blue-600/25",
  },
  r: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/25" },
  matlab: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/25",
  },
  // Frameworks
  react: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
  },
  nextjs: {
    bg: "bg-slate-400/15",
    text: "text-slate-300",
    border: "border-slate-400/25",
  },
  vue: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  django: {
    bg: "bg-green-600/15",
    text: "text-green-400",
    border: "border-green-600/25",
  },
  fastapi: {
    bg: "bg-teal-500/15",
    text: "text-teal-400",
    border: "border-teal-500/25",
  },
  flask: {
    bg: "bg-slate-300/15",
    text: "text-slate-300",
    border: "border-slate-300/25",
  },
  // ML / AI
  pytorch: {
    bg: "bg-orange-600/15",
    text: "text-orange-400",
    border: "border-orange-600/25",
  },
  tensorflow: {
    bg: "bg-orange-500/15",
    text: "text-orange-300",
    border: "border-orange-500/25",
  },
  sklearn: {
    bg: "bg-blue-400/15",
    text: "text-blue-300",
    border: "border-blue-400/25",
  },
  huggingface: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/25",
  },
  // Infra / DB
  docker: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/25",
  },
  kubernetes: {
    bg: "bg-blue-600/15",
    text: "text-blue-300",
    border: "border-blue-600/25",
  },
  postgres: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/25",
  },
  mongodb: {
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/25",
  },
  supabase: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  redis: {
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/25",
  },
  // Default
  default: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    border: "border-slate-500/25",
  },
};

function getTechStyle(tech) {
  const key = tech.toLowerCase().replace(/[^a-z]/g, "");
  return TECH_COLORS[key] || TECH_COLORS.default;
}

// ─────────────────────────────────────────────
// CATEGORY BADGE CONFIG
// ─────────────────────────────────────────────
const CATEGORY_CONFIG = {
  "Machine Learning": {
    gradient: "from-orange-500 to-amber-400",
    dot: "bg-orange-400",
  },
  "Deep Learning": {
    gradient: "from-red-500 to-orange-400",
    dot: "bg-red-400",
  },
  NLP: { gradient: "from-violet-500 to-purple-400", dot: "bg-violet-400" },
  "Computer Vision": {
    gradient: "from-blue-500 to-cyan-400",
    dot: "bg-blue-400",
  },
  "Web App": {
    gradient: "from-emerald-500 to-teal-400",
    dot: "bg-emerald-400",
  },
  "Data Science": {
    gradient: "from-yellow-500 to-amber-400",
    dot: "bg-yellow-400",
  },
  Bioinformatics: {
    gradient: "from-green-500 to-emerald-400",
    dot: "bg-green-400",
  },
  default: { gradient: "from-blue-500 to-indigo-400", dot: "bg-blue-400" },
};

function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG["default"];
}

// ─────────────────────────────────────────────
// TECH BADGE
// ─────────────────────────────────────────────
function TechBadge({ tech }) {
  const style = getTechStyle(tech);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide
        ${style.bg} ${style.text} ${style.border}`}
    >
      <FiCode size={9} />
      {tech}
    </span>
  );
}

// ─────────────────────────────────────────────
// STAT PILL (stars / forks / views)
// ─────────────────────────────────────────────
function StatPill({ icon: Icon, value, label }) {
  if (!value && value !== 0) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
      <Icon size={11} className="text-slate-500" />
      {typeof value === "number" ? value.toLocaleString() : value}
      {label && <span className="text-slate-600">{label}</span>}
    </span>
  );
}

// ─────────────────────────────────────────────
// FLOATING GLOW — decorative ambient light
// ─────────────────────────────────────────────
function FloatingGlow({ gradient, hovered }) {
  return (
    <motion.div
      className={`absolute -inset-px rounded-2xl opacity-0 bg-gradient-to-br ${gradient} blur-xl pointer-events-none`}
      animate={{ opacity: hovered ? 0.12 : 0 }}
      transition={{ duration: 0.4 }}
    />
  );
}

// ─────────────────────────────────────────────
// IMAGE SECTION with overlay on hover
// ─────────────────────────────────────────────
function CardImage({ image, title, category, hovered, featured }) {
  const catConfig = getCategoryConfig(category);

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-t-2xl bg-slate-800/80 flex-shrink-0">
      {/* Image or placeholder */}
      {image ? (
        <motion.img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          loading="lazy"
        />
      ) : (
        // Generative placeholder
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Gradient blob */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${catConfig.gradient} opacity-10`}
          />
          <motion.div
            animate={{ rotate: hovered ? 15 : 0, scale: hovered ? 1.1 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <FiCode size={40} className="text-slate-600" />
          </motion.div>
        </div>
      )}

      {/* Dark overlay on hover */}
      <motion.div
        className="absolute inset-0 bg-slate-900/60"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Hover overlay content */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center gap-3"
          >
            <span className="text-xs font-semibold text-white/80 tracking-widest uppercase">
              Explore Project
            </span>
            <FiArrowUpRight size={16} className="text-white/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category badge — top-left */}
      <div className="absolute top-3 left-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/90
            bg-gradient-to-r ${catConfig.gradient} shadow-lg`}
        >
          <span className={`w-1.5 h-1.5 rounded-full bg-white/70`} />
          {category || "Research"}
        </div>
      </div>

      {/* Featured badge — top-right */}
      {featured && (
        <div className="absolute top-3 right-3">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-amber-950 text-[10px] font-bold tracking-wide shadow-lg shadow-amber-500/30"
          >
            <HiSparkles size={10} />
            Featured
          </motion.div>
        </div>
      )}

      {/* Bottom gradient fade into card body */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900/80 to-transparent" />
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PROJECT CARD
// ─────────────────────────────────────────────
/**
 * ProjectCard Props:
 * @param {string}   title        — Project title
 * @param {string}   description  — Short description (1–3 sentences)
 * @param {string}   image        — Image URL (optional, fallback placeholder shown)
 * @param {string}   category     — e.g. "Machine Learning", "Web App", "NLP"
 * @param {string[]} technologies — Array of tech strings, e.g. ["Python", "PyTorch", "FastAPI"]
 * @param {string}   githubUrl    — GitHub repo URL (optional)
 * @param {string}   demoUrl      — Live demo / paper URL (optional)
 * @param {number}   stars        — GitHub stars count (optional)
 * @param {number}   forks        — GitHub forks count (optional)
 * @param {string}   year         — e.g. "2024"
 * @param {string}   status       — "Active" | "Completed" | "Archived" (optional)
 * @param {boolean}  featured     — Show featured badge
 * @param {number}   index        — Card index for stagger animation
 */
export default function ProjectCard({
  title = "Untitled Project",
  description = "No description provided.",
  image = null,
  category = "Research",
  technologies = [],
  githubUrl = null,
  demoUrl = null,
  stars = null,
  forks = null,
  year = null,
  status = null,
  featured = false,
  index = 0,
}) {
  const [hovered, setHovered] = useState(false);
  const catConfig = getCategoryConfig(category);

  const statusConfig = {
    Active: {
      color: "text-emerald-400",
      dot: "bg-emerald-400",
      label: "Active",
    },
    Completed: {
      color: "text-blue-400",
      dot: "bg-blue-400",
      label: "Completed",
    },
    Archived: {
      color: "text-slate-500",
      dot: "bg-slate-500",
      label: "Archived",
    },
  };
  const statusStyle = statusConfig[status] || null;

  // Show max 5 tech badges, rest collapsed
  const MAX_VISIBLE_TECH = 5;
  const visibleTech = technologies.slice(0, MAX_VISIBLE_TECH);
  const extraCount = technologies.length - MAX_VISIBLE_TECH;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group flex flex-col rounded-2xl overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      tabIndex={0}
      aria-label={`Project: ${title}`}
      role="article"
    >
      {/* Ambient glow behind card */}
      <FloatingGlow gradient={catConfig.gradient} hovered={hovered} />

      {/* Card surface */}
      <motion.div
        className="relative flex flex-col h-full rounded-2xl border border-white/8 bg-slate-900/80 backdrop-blur-sm overflow-hidden"
        animate={{
          boxShadow: hovered
            ? "0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(59,130,246,0.08)"
            : "0 4px 16px rgba(0,0,0,0.25)",
          y: hovered ? -4 : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Top gradient line */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${catConfig.gradient}`}
          animate={{ opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
        />

        {/* ── IMAGE SECTION ── */}
        <CardImage
          image={image}
          title={title}
          category={category}
          hovered={hovered}
          featured={featured}
        />

        {/* ── CONTENT SECTION ── */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <motion.h3
              className="text-base font-bold text-white leading-snug line-clamp-2 font-display"
              animate={{ color: hovered ? "#93c5fd" : "#ffffff" }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h3>

            {/* Year */}
            {year && (
              <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500 bg-slate-800 border border-white/8 px-2 py-0.5 rounded-md">
                {year}
              </span>
            )}
          </div>

          {/* Status pill */}
          {statusStyle && (
            <div className="flex items-center gap-1.5">
              <motion.span
                className={`inline-block w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                animate={{ scale: status === "Active" ? [1, 1.4, 1] : 1 }}
                transition={{
                  duration: 1.5,
                  repeat: status === "Active" ? Infinity : 0,
                }}
              />
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${statusStyle.color}`}
              >
                {statusStyle.label}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
            {description}
          </p>

          {/* Tech badges */}
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {visibleTech.map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
              {extraCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-slate-700/40 text-slate-400 border-slate-600/30">
                  <FiTag size={9} />+{extraCount} more
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/6 mt-auto" />

          {/* Footer: stats + actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Stats */}
            <div className="flex items-center gap-3">
              <StatPill icon={FiStar} value={stars} />
              <StatPill icon={FiGitBranch} value={forks} />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {githubUrl && (
                <motion.a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View GitHub repository"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-slate-800 border border-white/10 text-slate-300
                    hover:bg-slate-700 hover:text-white hover:border-white/20
                    transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FiGithub size={13} />
                  Code
                </motion.a>
              )}

              {demoUrl && (
                <motion.a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="View live demo"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-gradient-to-r from-blue-600 to-blue-500
                    hover:from-blue-500 hover:to-emerald-500
                    text-white shadow-md shadow-blue-600/20
                    hover:shadow-blue-500/30
                    transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <FiExternalLink size={13} />
                  Demo
                </motion.a>
              )}

              {/* If no links, show a view details arrow */}
              {!githubUrl && !demoUrl && (
                <motion.div
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500"
                  animate={{ x: hovered ? 3 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiEye size={12} />
                  Details
                  <FiArrowUpRight size={11} />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom shimmer sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="shimmer"
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/4 to-transparent skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "400%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────
// USAGE EXAMPLE (delete in production)
// ─────────────────────────────────────────────
//
// import ProjectCard from "@/components/ProjectCard";
//
// <ProjectCard
//   title="Attention-Based Neural Network for Medical Image Segmentation"
//   description="A transformer-based segmentation model achieving state-of-the-art performance on the BraTS 2023 benchmark with 94.2% Dice score."
//   image="/images/projects/brain-mri.jpg"
//   category="Computer Vision"
//   technologies={["Python", "PyTorch", "MONAI", "Docker", "FastAPI"]}
//   githubUrl="https://github.com/username/brain-seg"
//   demoUrl="https://demo.example.com"
//   stars={284}
//   forks={47}
//   year="2024"
//   status="Active"
//   featured={true}
//   index={0}
// />
