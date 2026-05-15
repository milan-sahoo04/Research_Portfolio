import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText,
  FiExternalLink,
  FiDownload,
  FiCopy,
  FiCheck,
  FiBookOpen,
  FiUsers,
  FiCalendar,
  FiAward,
  FiLink,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiBarChart2,
} from "react-icons/fi";
import { HiSparkles, HiAcademicCap } from "react-icons/hi2";
import { SiGooglescholar, SiSemanticscholar } from "react-icons/si";

// ─────────────────────────────────────────────
// PUBLICATION TYPE CONFIG
// ─────────────────────────────────────────────
const TYPE_CONFIG = {
  "Journal Article": {
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/12",
    text: "text-blue-400",
    border: "border-blue-500/25",
    glow: "rgba(59,130,246,0.15)",
    icon: FiBookOpen,
    short: "Journal",
  },
  "Conference Paper": {
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-500/12",
    text: "text-violet-400",
    border: "border-violet-500/25",
    glow: "rgba(139,92,246,0.15)",
    icon: FiUsers,
    short: "Conference",
  },
  "Book Chapter": {
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-500/12",
    text: "text-amber-400",
    border: "border-amber-500/25",
    glow: "rgba(245,158,11,0.15)",
    icon: FiBookOpen,
    short: "Book Chapter",
  },
  Preprint: {
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/12",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    glow: "rgba(16,185,129,0.15)",
    icon: FiFileText,
    short: "Preprint",
  },
  "Workshop Paper": {
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/12",
    text: "text-pink-400",
    border: "border-pink-500/25",
    glow: "rgba(236,72,153,0.15)",
    icon: FiFileText,
    short: "Workshop",
  },
  Patent: {
    gradient: "from-yellow-500 to-amber-400",
    bg: "bg-yellow-500/12",
    text: "text-yellow-400",
    border: "border-yellow-500/25",
    glow: "rgba(234,179,8,0.15)",
    icon: FiAward,
    short: "Patent",
  },
  Thesis: {
    gradient: "from-sky-500 to-blue-400",
    bg: "bg-sky-500/12",
    text: "text-sky-400",
    border: "border-sky-500/25",
    glow: "rgba(14,165,233,0.15)",
    icon: HiAcademicCap,
    short: "Thesis",
  },
  default: {
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/12",
    text: "text-slate-400",
    border: "border-slate-500/25",
    glow: "rgba(100,116,139,0.12)",
    icon: FiFileText,
    short: "Publication",
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

// ─────────────────────────────────────────────
// IMPACT / QUARTILE BADGE
// ─────────────────────────────────────────────
const QUARTILE_CONFIG = {
  Q1: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  Q2: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  Q3: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  Q4: {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
  },
};

function QuartileBadge({ quartile }) {
  if (!quartile) return null;
  const style = QUARTILE_CONFIG[quartile] || QUARTILE_CONFIG.Q4;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider
        ${style.bg} ${style.text} ${style.border}`}
    >
      {quartile}
    </span>
  );
}

// ─────────────────────────────────────────────
// COPY-TO-CLIPBOARD BUTTON
// ─────────────────────────────────────────────
function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${
          copied
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/20"
        }`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "check" : "copy"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center"
        >
          {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Copied!" : label}
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// AUTHOR LIST — highlight corresponding author
// ─────────────────────────────────────────────
function AuthorList({ authors = [], correspondingAuthor = null, expanded }) {
  const MAX_COLLAPSED = 3;
  const display = expanded ? authors : authors.slice(0, MAX_COLLAPSED);
  const hidden = authors.length - MAX_COLLAPSED;

  return (
    <p className="text-xs text-slate-400 leading-relaxed">
      {display.map((author, i) => {
        const isCorresponding =
          correspondingAuthor &&
          author.toLowerCase().includes(correspondingAuthor.toLowerCase());
        return (
          <span key={i}>
            <span
              className={
                isCorresponding
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400"
              }
            >
              {author}
            </span>
            {i < display.length - 1 && (
              <span className="text-slate-600">, </span>
            )}
          </span>
        );
      })}
      {!expanded && hidden > 0 && (
        <span className="text-slate-600"> +{hidden} more</span>
      )}
    </p>
  );
}

// ─────────────────────────────────────────────
// KEYWORD TAG
// ─────────────────────────────────────────────
function KeywordTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide bg-slate-800/80 border border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15 transition-colors cursor-default">
      #{label}
    </span>
  );
}

// ─────────────────────────────────────────────
// CITATION COUNT DISPLAY
// ─────────────────────────────────────────────
function CitationBadge({ count }) {
  if (count === null || count === undefined) return null;
  const tier =
    count >= 100
      ? "gold"
      : count >= 50
        ? "silver"
        : count >= 10
          ? "blue"
          : "default";
  const styles = {
    gold: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    silver: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    default: "bg-slate-700/40 text-slate-500 border-slate-600/30",
  };
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${styles[tier]}`}
    >
      <FiBarChart2 size={11} />
      <span>{count.toLocaleString()}</span>
      <span className="font-normal opacity-70">cited</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// ABSTRACT EXPANDER
// ─────────────────────────────────────────────
function AbstractSection({ abstract, expanded, onToggle }) {
  if (!abstract) return null;
  return (
    <div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="abstract"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1">
              <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-3 italic">
                {abstract}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.96 }}
      >
        {expanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        {expanded ? "Hide Abstract" : "Show Abstract"}
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────
// GENERATE BIBTEX STRING
// ─────────────────────────────────────────────
function generateBibtex({
  title,
  authors,
  journal,
  year,
  doi,
  volume,
  pages,
  type,
}) {
  const key = `${(authors[0] || "author").split(" ").pop()}${year || "2024"}`;
  const entryType = type === "Conference Paper" ? "inproceedings" : "article";
  const authorStr = (authors || []).join(" and ");
  let bib = `@${entryType}{${key},\n`;
  bib += `  title     = {${title || ""}},\n`;
  bib += `  author    = {${authorStr}},\n`;
  if (journal) bib += `  journal   = {${journal}},\n`;
  if (year) bib += `  year      = {${year}},\n`;
  if (volume) bib += `  volume    = {${volume}},\n`;
  if (pages) bib += `  pages     = {${pages}},\n`;
  if (doi) bib += `  doi       = {${doi}},\n`;
  bib += `}`;
  return bib;
}

// ─────────────────────────────────────────────
// MAIN PUBLICATION CARD
// ─────────────────────────────────────────────
/**
 * PublicationCard Props:
 * @param {string}   title                — Publication title
 * @param {string[]} authors              — Array of author names
 * @param {string}   correspondingAuthor  — Name to highlight in blue (e.g. your name)
 * @param {string}   journal              — Journal / conference / venue name
 * @param {string}   year                 — Publication year, e.g. "2024"
 * @param {string}   type                 — "Journal Article" | "Conference Paper" | "Preprint" | etc.
 * @param {string}   abstract             — Abstract text (optional, expandable)
 * @param {string[]} keywords             — Array of keyword strings (optional)
 * @param {number}   citations            — Citation count (optional)
 * @param {string}   impactFactor         — e.g. "12.4" (optional)
 * @param {string}   quartile             — "Q1" | "Q2" | "Q3" | "Q4" (optional)
 * @param {string}   doi                  — DOI string, e.g. "10.1000/xyz123" (optional)
 * @param {string}   pdfUrl               — Direct PDF URL (optional)
 * @param {string}   articleUrl           — Full article page URL (optional)
 * @param {string}   scholarUrl           — Google Scholar URL (optional)
 * @param {string}   semanticUrl          — Semantic Scholar URL (optional)
 * @param {string}   volume               — Journal volume (optional)
 * @param {string}   pages                — Page range, e.g. "112–134" (optional)
 * @param {boolean}  featured             — Highlight as featured/best paper
 * @param {number}   index                — Card index for stagger animation
 */
export default function PublicationCard({
  title = "Untitled Publication",
  authors = [],
  correspondingAuthor = null,
  journal = null,
  year = null,
  type = "Journal Article",
  abstract = null,
  keywords = [],
  citations = null,
  impactFactor = null,
  quartile = null,
  doi = null,
  pdfUrl = null,
  articleUrl = null,
  scholarUrl = null,
  semanticUrl = null,
  volume = null,
  pages = null,
  featured = false,
  index = 0,
}) {
  const [hovered, setHovered] = useState(false);
  const [abstractOpen, setAbstractOpen] = useState(false);
  const [authorsExpanded, setAuthorsExpanded] = useState(false);

  const typeConfig = getTypeConfig(type);
  const TypeIcon = typeConfig.icon;

  const bibtex = generateBibtex({
    title,
    authors,
    journal,
    year,
    doi,
    volume,
    pages,
    type,
  });
  const doiUrl = doi ? `https://doi.org/${doi}` : null;
  const MAX_KEYWORDS = 4;

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group focus:outline-none"
      tabIndex={0}
      aria-label={`Publication: ${title}`}
      role="article"
    >
      {/* Ambient glow */}
      <motion.div
        className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${typeConfig.gradient} blur-2xl pointer-events-none`}
        animate={{ opacity: hovered ? 0.13 : featured ? 0.06 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Card */}
      <motion.div
        className={`relative flex flex-col rounded-2xl border overflow-hidden
          ${
            featured
              ? "border-amber-500/25 bg-slate-900/90"
              : "border-white/8 bg-slate-900/80"
          } backdrop-blur-sm`}
        animate={{
          boxShadow: hovered
            ? `0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px ${typeConfig.glow}`
            : featured
              ? "0 8px 32px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(0,0,0,0.2)",
          y: hovered ? -3 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Top gradient accent line */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${typeConfig.gradient}`}
          animate={{ opacity: hovered ? 1 : featured ? 0.7 : 0.35 }}
          transition={{ duration: 0.3 }}
        />

        {/* Left accent bar */}
        <motion.div
          className={`absolute top-4 bottom-4 left-0 w-[3px] rounded-r-full bg-gradient-to-b ${typeConfig.gradient}`}
          animate={{ opacity: hovered ? 1 : 0.4, scaleY: hovered ? 1 : 0.6 }}
          transition={{ duration: 0.3 }}
        />

        {/* ── MAIN CONTENT ── */}
        <div className="flex flex-col gap-4 p-6 pl-7">
          {/* ── HEADER ROW ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                  ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
              >
                <TypeIcon size={11} />
                {typeConfig.short}
              </span>

              {/* Quartile */}
              <QuartileBadge quartile={quartile} />

              {/* Featured badge */}
              {featured && (
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-amber-950 text-[10px] font-bold shadow-lg shadow-amber-500/25"
                >
                  <HiSparkles size={10} />
                  Best Paper
                </motion.span>
              )}
            </div>

            {/* Year + Impact Factor */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {impactFactor && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                  <FiStar size={10} />
                  IF {impactFactor}
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-white/8 text-[11px] font-semibold text-slate-400">
                  <FiCalendar size={10} />
                  {year}
                </div>
              )}
            </div>
          </div>

          {/* ── TITLE ── */}
          <motion.h3
            className="text-[15px] font-bold text-white leading-snug font-display pr-2"
            animate={{ color: hovered ? "#bfdbfe" : "#ffffff" }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h3>

          {/* ── AUTHORS ── */}
          {authors.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FiUsers size={11} className="text-slate-600" />
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  Authors
                </span>
              </div>
              <AuthorList
                authors={authors}
                correspondingAuthor={correspondingAuthor}
                expanded={authorsExpanded}
              />
              {authors.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAuthorsExpanded((v) => !v);
                  }}
                  className="mt-1 text-[10px] font-semibold text-blue-500 hover:text-blue-400 transition-colors focus:outline-none"
                >
                  {authorsExpanded
                    ? "Show less"
                    : `Show all ${authors.length} authors`}
                </button>
              )}
            </div>
          )}

          {/* ── JOURNAL / VENUE ── */}
          {journal && (
            <div className="flex items-start gap-1.5">
              <FiBookOpen
                size={12}
                className="text-slate-600 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-slate-300 leading-snug">
                  {journal}
                </p>
                {(volume || pages) && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {volume && `Vol. ${volume}`}
                    {volume && pages && " · "}
                    {pages && `pp. ${pages}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── CITATIONS ── */}
          {citations !== null && (
            <div>
              <CitationBadge count={citations} />
            </div>
          )}

          {/* ── ABSTRACT ── */}
          {abstract && (
            <AbstractSection
              abstract={abstract}
              expanded={abstractOpen}
              onToggle={() => setAbstractOpen((v) => !v)}
            />
          )}

          {/* ── KEYWORDS ── */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, MAX_KEYWORDS).map((kw) => (
                <KeywordTag key={kw} label={kw} />
              ))}
              {keywords.length > MAX_KEYWORDS && (
                <span className="text-[10px] text-slate-600 self-center">
                  +{keywords.length - MAX_KEYWORDS}
                </span>
              )}
            </div>
          )}

          {/* ── DIVIDER ── */}
          <div className="h-px bg-white/6" />

          {/* ── ACTION ROW ── */}
          <div className="flex flex-wrap items-center gap-2">
            {/* PDF */}
            {pdfUrl && (
              <motion.a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Download PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-emerald-500
                  text-white shadow-md shadow-blue-600/20 hover:shadow-blue-500/30
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <FiDownload size={12} />
                PDF
              </motion.a>
            )}

            {/* Article link */}
            {articleUrl && (
              <motion.a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="View article"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-slate-800 border border-white/10 text-slate-300
                  hover:bg-slate-700 hover:text-white hover:border-white/20
                  transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <FiExternalLink size={12} />
                Article
              </motion.a>
            )}

            {/* DOI */}
            {doiUrl && (
              <motion.a
                href={doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="View DOI"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-slate-800 border border-white/10 text-slate-300
                  hover:bg-slate-700 hover:text-white hover:border-white/20
                  transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                <FiLink size={12} />
                DOI
              </motion.a>
            )}

            {/* Google Scholar */}
            {scholarUrl && (
              <motion.a
                href={scholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Google Scholar"
                className="flex items-center justify-center w-8 h-8 rounded-lg
                  bg-slate-800 border border-white/10 text-slate-400
                  hover:bg-indigo-600/20 hover:border-indigo-500/40 hover:text-indigo-400
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
              >
                <SiGooglescholar size={13} />
              </motion.a>
            )}

            {/* Semantic Scholar */}
            {semanticUrl && (
              <motion.a
                href={semanticUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Semantic Scholar"
                className="flex items-center justify-center w-8 h-8 rounded-lg
                  bg-slate-800 border border-white/10 text-slate-400
                  hover:bg-sky-600/20 hover:border-sky-500/40 hover:text-sky-400
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
              >
                <SiSemanticscholar size={13} />
              </motion.a>
            )}

            {/* BibTeX copy — pushed to the right */}
            <div className="ml-auto">
              <CopyButton text={bibtex} label="BibTeX" />
            </div>
          </div>
        </div>

        {/* Shimmer sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="shimmer"
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/4 to-transparent skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "600%" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
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
// import PublicationCard from "@/components/PublicationCard";
//
// <PublicationCard
//   title="Transformer-Based Neural Architecture for Multi-Modal Medical Image Segmentation"
//   authors={["Priya Sharma", "Arjun Mehta", "Li Wei", "Sana Khan", "David Roberts"]}
//   correspondingAuthor="Priya Sharma"
//   journal="Nature Machine Intelligence"
//   year="2024"
//   type="Journal Article"
//   abstract="We propose MedFormer, a novel transformer-based architecture for simultaneous segmentation of multiple organs across CT and MRI modalities, achieving state-of-the-art performance on three public benchmarks."
//   keywords={["Transformer", "Medical Imaging", "Segmentation", "Multi-Modal"]}
//   citations={142}
//   impactFactor="23.8"
//   quartile="Q1"
//   doi="10.1038/s42256-024-00123-4"
//   pdfUrl="/papers/medformer-2024.pdf"
//   articleUrl="https://nature.com/articles/s42256-024-00123-4"
//   scholarUrl="https://scholar.google.com/scholar?q=MedFormer"
//   volume="6"
//   pages="112–134"
//   featured={true}
//   index={0}
// />
