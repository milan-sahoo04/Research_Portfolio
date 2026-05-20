// src/pages/public/Publications.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ExternalLink,
  Download,
  Star,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { API_URL } from "../../utils/constants";

// ─── API helpers ──────────────────────────────────────────
async function fetchPublications({
  page = 1,
  limit = 12,
  search = "",
  year = "",
} = {}) {
  const params = new URLSearchParams({ page, limit, search, year });
  const res = await fetch(`${API_URL}/publications?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchFeatured() {
  const res = await fetch(`${API_URL}/publications/featured`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

// ─── Publication Card ─────────────────────────────────────
function PublicationCard({ pub, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative rounded-2xl border border-[#1E293B] p-6 flex flex-col gap-4 hover:border-indigo-500/30 transition-all duration-300"
      style={{ background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)" }}
    >
      {/* Featured badge */}
      {pub.featured && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <Star size={9} fill="currentColor" /> Featured
        </span>
      )}

      {/* Title */}
      <div className="pr-16">
        <h3 className="text-white font-semibold text-base leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {pub.title}
        </h3>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {pub.authors?.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Users size={11} />
            {pub.authors.slice(0, 3).join(", ")}
            {pub.authors.length > 3 && ` +${pub.authors.length - 3}`}
          </span>
        )}
        {pub.journal_name && (
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} />
            {pub.journal_name}
          </span>
        )}
        {pub.date && (
          <span className="flex items-center gap-1.5">
            <Calendar size={11} />
            {new Date(pub.date).getFullYear()}
          </span>
        )}
      </div>

      {/* Abstract */}
      {pub.abstract && (
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
          {pub.abstract}
        </p>
      )}

      {/* Keywords */}
      {pub.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pub.keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className="text-[10px] px-2 py-0.5 rounded-full border border-[#1E293B] text-slate-500"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#1E293B]">
        {pub.doi && (
          <a
            href={pub.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
          >
            <ExternalLink size={12} /> View Paper
          </a>
        )}
        {pub.pdf_url && (
          <a
            href={pub.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10"
          >
            <Download size={12} /> PDF
          </a>
        )}
      </div>
    </motion.article>
  );
}

// ─── Featured strip ───────────────────────────────────────
function FeaturedSection({ pubs }) {
  if (!pubs?.length) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Star size={14} className="text-amber-400" fill="currentColor" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          Featured
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pubs.map((pub, i) => (
          <PublicationCard key={pub.id} pub={pub} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function Publications() {
  const [pubs, setPubs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const timer = useRef(null);
  const isFirst = useRef(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  const loadPubs = useCallback(
    async (pg = 1, q = search, year = yearFilter) => {
      setLoading(true);
      try {
        const r = await fetchPublications({
          page: pg,
          limit: 12,
          search: q,
          year,
        });
        if (r.success) {
          setPubs(r.data);
          setPagination(r.pagination);
        }
      } catch {
        setPubs([]);
      } finally {
        setLoading(false);
      }
    },
    [search, yearFilter],
  );

  useEffect(() => {
    fetchFeatured()
      .then((r) => r.success && setFeatured(r.data))
      .catch(() => {});
    loadPubs(1);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    loadPubs(page);
  }, [page, yearFilter]); // eslint-disable-line

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      loadPubs(1, v);
    }, 400);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Research Output
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Publications</h1>
          <p className="text-slate-500 text-base">
            {pagination.total > 0
              ? `${pagination.total} publications`
              : "Browse our research publications"}
          </p>
        </motion.div>

        {/* Featured */}
        <FeaturedSection pubs={featured} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 p-4 rounded-2xl border border-[#1E293B] mb-8"
          style={{
            background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
          }}
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by title, author, keyword..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="pl-4 pr-8 py-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-24"
            >
              <Loader2 size={32} className="text-violet-400 animate-spin" />
            </motion.div>
          ) : pubs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-24 text-slate-600"
            >
              <BookOpen size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium text-slate-500">
                No publications found
              </p>
              <p className="text-sm mt-1">
                Try adjusting your search or year filter
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {pubs.map((pub, i) => (
                <PublicationCard key={pub.id} pub={pub} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-10 flex-wrap gap-4">
            <p className="text-slate-600 text-sm">
              Page {page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-[#1E293B] flex items-center justify-center text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="w-9 h-9 rounded-xl border border-[#1E293B] flex items-center justify-center text-slate-400 hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
