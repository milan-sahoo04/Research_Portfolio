/**
 * Format a date string to a human-readable format.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(date, options = {}) {
  const defaults = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("en-US", {
    ...defaults,
    ...options,
  });
}

/**
 * Relative time (e.g. "2 days ago")
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "week", secs: 604800 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str, max = 100) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

/**
 * Estimate reading time for a given text.
 */
export function readingTime(text) {
  const words = text?.split(/\s+/).length || 0;
  const mins = Math.ceil(words / 200);
  return `${mins} min read`;
}

/**
 * Slugify a string.
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a large number (e.g. 1200 → "1.2k")
 */
export function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get initials from a full name.
 */
export function getInitials(name) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Generate a random gradient based on a string (deterministic).
 */
const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-indigo-500 to-purple-600",
  "from-purple-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-teal-500 to-emerald-600",
];

export function stringToGradient(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
