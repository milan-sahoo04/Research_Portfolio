// src/pages/public/BlogDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Star,
  User,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import axios from "../../api/axios";

function Skeleton({ className }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.06)" }}
    />
  );
}

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    axios
      .get(`/blogs/${id}`)
      .then((res) => {
        if (res.data?.success) setBlog(res.data.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen pt-24 pb-16"
        style={{ background: "var(--bg-primary, #0f172a)" }}
      >
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (error || !blog) {
    return (
      <div
        className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center"
        style={{ background: "var(--bg-primary, #0f172a)" }}
      >
        <p className="text-5xl mb-4">📄</p>
        <h2 className="text-white text-xl font-bold mb-2">Blog not found</h2>
        <p className="text-slate-500 text-sm mb-6">
          This post may have been removed or the link is invalid.
        </p>
        <Link
          to="/blogs"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)" }}
        >
          <ArrowLeft size={15} /> Back to Blogs
        </Link>
      </div>
    );
  }

  // ── Content ──────────────────────────────────────────────
  const formattedDate = blog.created_at
    ? new Date(blog.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Estimate read time (~200 wpm)
  const wordCount = blog.content?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div
      className="min-h-screen pt-24 pb-20"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="max-w-3xl mx-auto px-4">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft size={15} />
            Back to Blogs
          </button>
        </motion.div>

        {/* Category + Featured badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2 mb-4 flex-wrap"
        >
          {blog.category && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#818cf8",
              }}
            >
              {blog.category}
            </span>
          )}
          {blog.featured && (
            <span
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#fbbf24",
              }}
            >
              <Star size={10} fill="currentColor" /> Featured
            </span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold mb-5 leading-tight"
          style={{ color: "#f1f5f9" }}
        >
          {blog.title}
        </motion.h1>

        {/* Meta row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center gap-4 flex-wrap mb-8 text-sm"
          style={{ color: "#475569" }}
        >
          {formattedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {formattedDate}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {readTime} min read
          </span>
          {blog.author_id && (
            <span className="flex items-center gap-1.5">
              <User size={13} />
              Author
            </span>
          )}
          {/* Share */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 ml-auto transition-colors duration-200"
            style={{ color: copied ? "#22d3ee" : "#475569" }}
            title="Copy link"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </motion.div>

        {/* Cover image */}
        {blog.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mb-10 rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full max-h-[420px] object-cover"
            />
          </motion.div>
        )}

        {/* Excerpt */}
        {blog.excerpt && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-lg leading-relaxed mb-8 pb-8 font-medium italic"
            style={{
              color: "#94a3b8",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {blog.excerpt}
          </motion.p>
        )}

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="prose-blog"
          style={{ color: "#cbd5e1" }}
        >
          {blog.content?.split("\n").map((para, i) =>
            para.trim() ? (
              <p
                key={i}
                className="mb-5 leading-[1.85] text-base"
                style={{ color: "#cbd5e1" }}
              >
                {para}
              </p>
            ) : (
              <div key={i} className="mb-3" />
            ),
          )}
        </motion.div>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 pt-8 flex items-center gap-2 flex-wrap"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Tag size={13} style={{ color: "#475569" }} />
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* Back to blogs footer link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-14 flex justify-center"
        >
          <Link
            to="/blogs"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.1)";
            }}
          >
            <ArrowLeft size={15} /> Browse all posts
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
