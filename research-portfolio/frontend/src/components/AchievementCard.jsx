import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Badge config ────────────────────────────────────────────
const TYPE_CONFIG = {
  patent: {
    label: "Patent",
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    glow: "shadow-violet-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    ribbonAccent: "#8B5CF6",
  },
  award: {
    label: "Award",
    gradient: "from-amber-400 to-orange-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    glow: "shadow-amber-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
        />
      </svg>
    ),
    ribbonAccent: "#F59E0B",
  },
  certification: {
    label: "Certification",
    gradient: "from-emerald-400 to-teal-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    glow: "shadow-emerald-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
        />
      </svg>
    ),
    ribbonAccent: "#10B981",
  },
  grant: {
    label: "Grant",
    gradient: "from-sky-400 to-blue-600",
    lightBg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-300",
    glow: "shadow-sky-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    ribbonAccent: "#3B82F6",
  },
  fellowship: {
    label: "Fellowship",
    gradient: "from-rose-400 to-pink-600",
    lightBg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
    glow: "shadow-rose-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    ribbonAccent: "#EC4899",
  },
  other: {
    label: "Achievement",
    gradient: "from-slate-500 to-gray-600",
    lightBg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    glow: "shadow-slate-500/20",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
    ribbonAccent: "#6B7280",
  },
};

// ─── Sparkle particle on reveal ─────────────────────────────
const Sparkle = ({ style }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-current pointer-events-none"
    style={style}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -24] }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  />
);

// ─── Main Component ──────────────────────────────────────────
const AchievementCard = ({
  achievement = {},
  index = 0,
  viewMode = "grid", // "grid" | "list"
}) => {
  const {
    title = "Untitled Achievement",
    type = "other",
    year = new Date().getFullYear(),
    month,
    description = "",
    issuedBy = "",
    documentUrl = "",
    patentNumber = "",
    featured = false,
  } = achievement;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  const [hovered, setHovered] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateLabel = month ? `${monthNames[month - 1]} ${year}` : String(year);

  const triggerSparkles = () => {
    const s = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      style: {
        left: `${20 + Math.random() * 60}%`,
        top: `${20 + Math.random() * 40}%`,
        color: config.ribbonAccent,
      },
    }));
    setSparkles(s);
    setTimeout(() => setSparkles([]), 800);
  };

  // ── Shared card inner content ──
  const CardContent = () => (
    <>
      {/* Top row: icon badge + date + featured star */}
      <div className="flex items-start justify-between gap-3 mb-4">
        {/* Icon badge */}
        <motion.div
          className={`relative flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-lg ${config.glow}`}
          whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          {config.icon}
          {/* Pulse ring on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.span
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-40`}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Date chip */}
          <span className="text-xs font-semibold tracking-wide text-gray-400 dark:text-gray-500 font-mono">
            {dateLabel}
          </span>
          {/* Featured star */}
          {featured && (
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-amber-400 text-base"
              title="Featured Achievement"
            >
              ★
            </motion.span>
          )}
        </div>
      </div>

      {/* Type badge */}
      <div className="mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.lightBg} ${config.border} ${config.text}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${config.gradient}`}
          />
          {config.label}
          {patentNumber && (
            <span className="opacity-70 font-mono text-[10px]">
              · {patentNumber}
            </span>
          )}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-bold leading-snug text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-300 transition-all duration-300">
        {title}
      </h3>

      {/* Issued by */}
      {issuedBy && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
          {issuedBy}
        </p>
      )}

      {/* Description with expand */}
      {description && (
        <div className="mb-4">
          <AnimatePresence initial={false}>
            <motion.p
              key={expanded ? "expanded" : "collapsed"}
              className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {description}
            </motion.p>
          </AnimatePresence>
          {description.length > 120 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className={`mt-1 text-xs font-semibold ${config.text} hover:underline focus:outline-none transition-colors`}
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
          )}
        </div>
      )}

      {/* Bottom row: gradient line + download */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        {/* Animated progress bar accent */}
        <motion.div
          className={`h-0.5 rounded-full bg-gradient-to-r ${config.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: hovered ? "45%" : "24px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {documentUrl ? (
          <motion.a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              triggerSparkles();
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white shadow-md ${config.glow} shadow-lg`}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.96 }}
            title="Download Document"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download
          </motion.a>
        ) : (
          <span className="text-[11px] text-gray-400 dark:text-gray-600 italic">
            No document
          </span>
        )}
      </div>

      {/* Sparkles overlay */}
      {sparkles.map((s) => (
        <Sparkle key={s.id} style={s.style} />
      ))}
    </>
  );

  // ── GRID view ──────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <motion.div
        className="group relative"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.5,
          delay: index * 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Glow layer */}
        <motion.div
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 blur-sm`}
          animate={{ opacity: hovered ? 0.3 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Card surface */}
        <motion.div
          className="relative flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden cursor-default shadow-sm"
          animate={{
            y: hovered ? -4 : 0,
            boxShadow: hovered
              ? `0 20px 40px -8px ${config.ribbonAccent}30, 0 8px 16px -4px rgba(0,0,0,0.12)`
              : "0 1px 3px rgba(0,0,0,0.06)",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Corner ribbon for featured */}
          {featured && (
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
              <div
                className={`absolute top-2 right-[-18px] w-20 text-center text-[9px] font-bold text-white py-0.5 rotate-45 bg-gradient-to-r ${config.gradient}`}
              >
                FEATURED
              </div>
            </div>
          )}

          {/* Subtle top gradient wash */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`}
          />

          <CardContent />
        </motion.div>
      </motion.div>
    );
  }

  // ── LIST view ──────────────────────────────────────────────
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Left accent bar */}
      <motion.div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b ${config.gradient}`}
        animate={{ scaleY: hovered ? 1 : 0.6, opacity: hovered ? 1 : 0.5 }}
        style={{ originY: 0.5 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="relative ml-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col sm:flex-row gap-4 overflow-hidden shadow-sm"
        animate={{
          x: hovered ? 4 : 0,
          boxShadow: hovered
            ? `0 8px 24px -4px ${config.ribbonAccent}25`
            : "0 1px 3px rgba(0,0,0,0.06)",
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-md self-start`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.lightBg} ${config.border} ${config.text}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${config.gradient}`}
              />
              {config.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {dateLabel}
            </span>
            {featured && <span className="text-amber-400 text-sm">★</span>}
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug mb-1">
            {title}
          </h3>

          {issuedBy && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {issuedBy}
            </p>
          )}

          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right: download */}
        <div className="flex-shrink-0 self-center">
          {documentUrl ? (
            <motion.a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={triggerSparkles}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white shadow-md`}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              PDF
            </motion.a>
          ) : null}
        </div>

        {/* Sparkles */}
        {sparkles.map((s) => (
          <Sparkle key={s.id} style={s.style} />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AchievementCard;

// ─── Demo / Preview ───────────────────────────────────────────
// Uncomment below and render <AchievementCardDemo /> in your app to preview.

export const AchievementCardDemo = () => {
  const [viewMode, setViewMode] = useState("grid");

  const achievements = [
    {
      title:
        "Method for Real-time Anomaly Detection in IoT Health Monitoring Systems",
      type: "patent",
      year: 2024,
      month: 3,
      issuedBy: "Indian Patent Office",
      patentNumber: "IN 202411023456",
      description:
        "A novel machine learning-based method for detecting health anomalies in wearable IoT sensors with sub-100ms latency.",
      documentUrl: "#",
      featured: true,
    },
    {
      title:
        "Best Paper Award — IEEE International Conference on AI in Healthcare",
      type: "award",
      year: 2023,
      month: 11,
      issuedBy: "IEEE Society",
      description:
        "Recognized for outstanding research contribution in AI-driven diagnostic systems for rural healthcare.",
      documentUrl: "#",
      featured: true,
    },
    {
      title: "DST-SERB Early Career Research Grant",
      type: "grant",
      year: 2023,
      month: 5,
      issuedBy: "Dept. of Science & Technology, Govt. of India",
      description:
        "Awarded ₹25 Lakhs for three-year project on AI-based air quality prediction for urban planning.",
      documentUrl: "#",
    },
    {
      title: "Google Cloud Professional Data Engineer",
      type: "certification",
      year: 2022,
      month: 8,
      issuedBy: "Google Cloud",
      description:
        "Certification validating expertise in designing and building data processing systems on Google Cloud Platform.",
      documentUrl: "#",
    },
    {
      title: "Fulbright-Nehru Doctoral Research Fellowship",
      type: "fellowship",
      year: 2021,
      issuedBy: "United States-India Educational Foundation",
      description:
        "Prestigious fellowship for collaborative research at MIT Media Lab on environmental sensing technologies.",
      documentUrl: "#",
    },
    {
      title: "Outstanding Thesis Award — Computer Science Dept.",
      type: "other",
      year: 2020,
      issuedBy: "NIT Rourkela",
      description:
        "Awarded for exceptional doctoral thesis on deep learning approaches for remote sensing data analysis.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Achievements & Patents
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Recognition, intellectual property, and funding milestones
          </p>

          {/* View toggle */}
          <div className="inline-flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm gap-1">
            {["grid", "list"].map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  viewMode === mode
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                whileTap={{ scale: 0.96 }}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="viewPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative capitalize">{mode}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-4"
            }
          >
            {achievements.map((a, i) => (
              <AchievementCard
                key={i}
                achievement={a}
                index={i}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
