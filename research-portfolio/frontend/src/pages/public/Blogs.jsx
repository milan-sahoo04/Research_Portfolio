// src/pages/public/Blogs.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { BLOG_CATEGORIES } from "../../utils/constants";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    axios
      .get("/blogs?limit=20")
      .then((res) => {
        if (res.data?.success) setBlogs(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = blogs.filter((b) => {
    const matchSearch =
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="container-custom px-4">
        {/* Header */}
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
            Knowledge Hub
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mt-2 mb-4"
            style={{ color: "#f8fafc" }}
          >
            Research Blog
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Insights, tutorials, and deep-dives from our research team.
          </p>
        </motion.div>

        {/* Search + Filter */}
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
              placeholder="Search articles..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f1f5f9",
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {BLOG_CATEGORIES.map((c) => (
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

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#475569" }}>
            No articles found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((blog, i) => (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {blog.cover_image && (
                  <img
                    src={blog.cover_image}
                    alt={blog.title}
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full self-start mb-3"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      color: "#818cf8",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    {blog.category || "Research"}
                  </span>
                  <h3
                    className="font-bold mb-2 group-hover:text-indigo-400 transition-colors"
                    style={{ color: "#f1f5f9" }}
                  >
                    {blog.title}
                  </h3>
                  <p
                    className="text-sm flex-1 mb-4"
                    style={{ color: "#64748b" }}
                  >
                    {blog.excerpt?.slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: "#475569" }}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                      {blog.read_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {blog.read_time} min
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/blogs/${blog._id}`}
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "#6366f1" }}
                    >
                      Read <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
