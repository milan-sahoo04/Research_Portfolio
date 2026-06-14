// src/pages/public/PublicationDetails.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Star,
  BookOpen,
  Loader2,
  Calendar,
  Users,
  Tag,
} from "lucide-react";
import { API_URL } from "../../utils/constants";

async function fetchPublication(id) {
  const res = await fetch(`${API_URL}/publications/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function PublicationDetails() {
  const { id } = useParams();
  const [pub, setPub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchPublication(id)
      .then((r) => {
        if (r.success) setPub(r.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 size={32} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error || !pub) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center text-center px-4">
        <BookOpen size={48} className="mb-4 opacity-30 text-slate-600" />
        <h1 className="text-2xl font-bold mb-2 text-white">
          Publication not found
        </h1>
        <p className="mb-6 text-slate-500">
          The publication you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/publications"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400"
        >
          <ArrowLeft size={15} /> Back to Publications
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/publications"
            className="inline-flex items-center gap-2 text-sm font-medium mb-8 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Publications
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-[#1E293B] p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
          }}
        >
          {/* Featured badge */}
          {pub.featured && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4">
              <Star size={11} fill="currentColor" /> Featured Publication
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-4">
            {pub.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-6 pb-6 border-b border-[#1E293B]">
            {pub.authors?.length > 0 && (
              <span className="flex items-center gap-2">
                <Users size={14} className="text-slate-500" />
                {pub.authors.join(", ")}
              </span>
            )}
            {pub.journal_name && (
              <span className="flex items-center gap-2">
                <BookOpen size={14} className="text-slate-500" />
                {pub.journal_name}
              </span>
            )}
            {pub.date && (
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                {new Date(pub.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          {/* Abstract */}
          {pub.abstract && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                Abstract
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {pub.abstract}
              </p>
            </div>
          )}

          {/* Keywords */}
          {pub.keywords?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
                Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {pub.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[#1E293B] text-slate-400"
                  >
                    <Tag size={12} /> {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#1E293B]">
            {pub.doi && (
              <a
                href={pub.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                }}
              >
                <ExternalLink size={14} /> View Paper / DOI
              </a>
            )}
            {pub.pdf_url && (
              <a
                href={pub.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#1E293B] text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <Download size={14} /> Download PDF
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
