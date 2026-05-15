import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const estimateReadTime = (content = "", readTime = null) => {
  if (readTime) return readTime;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

// Tag color palette — cycles through based on tag string hash
const TAG_COLORS = [
  {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  {
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
  },
  {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
  },
  {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/20",
  },
  {
    bg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/15",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    border: "border-fuchsia-500/20",
  },
  {
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20",
  },
];

const getTagColor = (tag = "") => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++)
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

// ─── Fallback cover gradient when no image ────────────────────────────────────
const COVER_GRADIENTS = [
  "from-blue-600 via-indigo-600 to-violet-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-rose-500 via-pink-600 to-fuchsia-700",
  "from-amber-500 via-orange-500 to-red-600",
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-violet-600 via-purple-600 to-fuchsia-700",
];

const getCoverGradient = (title = "") => {
  let hash = 0;
  for (let i = 0; i < title.length; i++)
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
};

// ─── Abstract pattern SVG for fallback cover ─────────────────────────────────
const AbstractPattern = ({ gradient }) => (
  <div
    className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
  >
    {/* Decorative circles */}
    <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/8" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/5" />
    {/* Document icon */}
    <svg
      className="w-12 h-12 text-white/30 relative z-10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  </div>
);

// ─── GRID CARD ────────────────────────────────────────────────────────────────
const GridCard = ({ blog, index, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const gradient = getCoverGradient(blog.title);
  const readTime = estimateReadTime(blog.content, blog.readTime);

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer shadow-sm"
      whileHover={{
        y: -6,
        boxShadow:
          "0 24px 48px -8px rgba(0,0,0,0.15), 0 8px 20px -4px rgba(0,0,0,0.08)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="button"
      tabIndex={0}
      aria-label={`Read blog post: ${blog.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* ── Cover image ── */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {blog.coverImage && !imgError ? (
          <motion.img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <AbstractPattern gradient={gradient} />
        )}

        {/* Gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Read time badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          <svg
            className="w-3 h-3 text-white/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
          <span className="text-[10px] font-semibold text-white/90">
            {readTime} min read
          </span>
        </div>

        {/* Featured badge */}
        {blog.featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/90 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-amber-900">
              ✦ FEATURED
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {blog.tags.slice(0, 3).map((tag) => {
              const c = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}
                >
                  {tag}
                </span>
              );
            })}
            {blog.tags.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                +{blog.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-[15px] font-bold leading-snug text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4 flex-1">
            {blog.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          {/* Author + Date */}
          <div className="flex items-center gap-2.5 min-w-0">
            {blog.author?.photoUrl ? (
              <img
                src={blog.author.photoUrl}
                alt={blog.author.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-gray-900"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {blog.author?.name?.[0]?.toUpperCase() ?? "R"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate leading-tight">
                {blog.author?.name ?? "Researcher"}
              </p>
              {blog.publishedAt && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                  {formatDate(blog.publishedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Read arrow */}
          <motion.div
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 flex-shrink-0"
            animate={{ x: hovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-[11px] font-semibold">Read</span>
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line — slides in on hover */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: hovered ? "100%" : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </motion.article>
  );
};

// ─── LIST CARD ────────────────────────────────────────────────────────────────
const ListCard = ({ blog, index, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const gradient = getCoverGradient(blog.title);
  const readTime = estimateReadTime(blog.content, blog.readTime);

  return (
    <motion.article
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="group relative flex gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer p-4 shadow-sm"
      whileHover={{
        x: 4,
        boxShadow: "0 8px 28px -4px rgba(0,0,0,0.12)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="button"
      tabIndex={0}
      aria-label={`Read blog post: ${blog.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Left accent */}
      <motion.div
        className={`absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b ${gradient}`}
        animate={{ scaleY: hovered ? 1 : 0.4, opacity: hovered ? 1 : 0 }}
        style={{ originY: 0.5 }}
        transition={{ duration: 0.3 }}
      />

      {/* Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
        {blog.coverImage && !imgError ? (
          <motion.img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <svg
              className="w-8 h-8 text-white/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.slice(0, 2).map((tag) => {
              const c = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-bold leading-snug text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {blog.title}
        </h3>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 leading-relaxed">
            {blog.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-auto">
          {blog.publishedAt && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {formatDate(blog.publishedAt)}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
            {readTime} min
          </span>
          {blog.views > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {blog.views}
            </span>
          )}

          {/* Arrow */}
          <motion.div
            className="ml-auto flex items-center gap-1 text-blue-600 dark:text-blue-400"
            animate={{ x: hovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
};

// ─── FEATURED HERO CARD (for first/featured post) ─────────────────────────────
const FeaturedCard = ({ blog, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const gradient = getCoverGradient(blog.title);
  const readTime = estimateReadTime(blog.content, blog.readTime);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="group relative col-span-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer shadow-sm flex flex-col md:flex-row"
      whileHover={{ boxShadow: "0 28px 56px -10px rgba(0,0,0,0.18)" }}
      transition={{ duration: 0.3 }}
      role="button"
      tabIndex={0}
      aria-label={`Read featured post: ${blog.title}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Cover — left side on md+ */}
      <div className="relative md:w-2/5 h-56 md:h-auto overflow-hidden flex-shrink-0">
        {blog.coverImage && !imgError ? (
          <motion.img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <AbstractPattern gradient={gradient} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 md:block hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden" />

        {/* Featured badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/95 backdrop-blur-sm shadow-lg">
          <span className="text-[11px] font-bold text-amber-900 tracking-wide">
            ✦ FEATURED
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 md:p-8">
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.slice(0, 4).map((tag) => {
              const c = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-extrabold leading-tight text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {blog.title}
        </h2>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-6 flex-1">
            {blog.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            {blog.author?.photoUrl ? (
              <img
                src={blog.author.photoUrl}
                alt={blog.author.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800">
                {blog.author?.name?.[0]?.toUpperCase() ?? "R"}
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                {blog.author?.name ?? "Researcher"}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                {blog.publishedAt && (
                  <span>{formatDate(blog.publishedAt)}</span>
                )}
                <span>·</span>
                <span>{readTime} min read</span>
                {blog.views > 0 && (
                  <>
                    <span>·</span>
                    <span>{blog.views} views</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CTA button */}
          <motion.button
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Read Post
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: hovered ? "100%" : "0%" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.article>
  );
};

// ─── MAIN BlogCard component ───────────────────────────────────────────────────
// Props:
//   blog       — blog object from Supabase
//   index      — position in list (for stagger delay)
//   viewMode   — "grid" | "list" | "featured"
//   onCardClick — optional override; defaults to navigate("/blog/:slug")
//
// blog shape:
//   { id, title, slug, excerpt, content, coverImage, tags[], publishedAt,
//     readTime, views, featured, author: { name, photoUrl } }

const BlogCard = ({ blog = {}, index = 0, viewMode = "grid", onCardClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(blog);
      return;
    }
    if (blog.slug) navigate(`/blog/${blog.slug}`);
    else if (blog.id) navigate(`/blog/${blog.id}`);
  };

  if (viewMode === "featured") {
    return <FeaturedCard blog={blog} onClick={handleClick} />;
  }

  if (viewMode === "list") {
    return <ListCard blog={blog} index={index} onClick={handleClick} />;
  }

  return <GridCard blog={blog} index={index} onClick={handleClick} />;
};

export default BlogCard;
