// src/pages/public/Feedback.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Star,
  Loader2,
  User,
  Mail,
} from "lucide-react";
import { API_URL } from "../../utils/constants";

const SUBJECTS = ["General", "Research", "Website", "Collaboration", "Other"];
const RATINGS = [1, 2, 3, 4, 5];

async function submitFeedback(data) {
  const res = await fetch(`${API_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export default function Feedback() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General",
    rating: 0,
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const handleChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.message.trim()) e.message = "Message is required.";
    else if (form.message.trim().length < 10)
      e.message = "Message must be at least 10 characters.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await submitFeedback({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      // Show backend validation errors if present
      if (err?.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(
          err?.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const base =
    "w-full px-4 py-2.5 bg-[#111827] border rounded-xl text-white text-sm focus:outline-none transition-all placeholder-slate-600";
  const fieldCls = (key) =>
    `${base} ${errors[key] ? "border-red-500/50 focus:border-red-500/70" : "border-[#1E293B] focus:border-indigo-500/50"}`;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare size={15} className="text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              We'd love to hear from you
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Feedback</h1>
          <p className="text-slate-500">
            Share your thoughts, suggestions, or report issues. Every piece of
            feedback helps us improve.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-500/20 p-12 text-center"
              style={{
                background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Thank you!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Your feedback has been received. We'll get back to you soon.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    email: "",
                    subject: "General",
                    rating: 0,
                    message: "",
                  });
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all"
              >
                Submit Another
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#1E293B] overflow-hidden"
              style={{
                background: "linear-gradient(135deg,#0F172A 0%,#0A0F1E 100%)",
              }}
            >
              <div className="p-6 space-y-5">
                {/* Name + Email — both required */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Your name"
                        className={`${fieldCls("name")} pl-9`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-red-400 mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />
                      <input
                        type="email"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="your@email.com"
                        className={`${fieldCls("email")} pl-9`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject (was "category") */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                    Subject
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm((p) => ({ ...p, subject: s }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.subject === s
                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                            : "border-[#1E293B] text-slate-500 hover:border-slate-600 hover:text-slate-400"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating (frontend-only UX, not sent to backend) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                    Rating{" "}
                    <span className="text-slate-700 normal-case font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    {RATINGS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setForm((p) => ({ ...p, rating: r }))}
                        onMouseEnter={() => setHoverRating(r)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={22}
                          className="transition-colors"
                          fill={
                            (hoverRating || form.rating) >= r
                              ? "#F59E0B"
                              : "none"
                          }
                          stroke={
                            (hoverRating || form.rating) >= r
                              ? "#F59E0B"
                              : "#334155"
                          }
                        />
                      </button>
                    ))}
                    {form.rating > 0 && (
                      <span className="text-xs text-slate-500 ml-2">
                        {
                          ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                            form.rating
                          ]
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={handleChange("message")}
                    rows={5}
                    placeholder="Share your thoughts, suggestions, or report an issue... (min. 10 characters)"
                    className={`${fieldCls("message")} resize-none`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message ? (
                      <p className="text-xs text-red-400">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={`text-xs ${form.message.length > 1900 ? "text-amber-400" : "text-slate-700"}`}
                    >
                      {form.message.length}/2000
                    </p>
                  </div>
                </div>

                {/* Server error */}
                {serverError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {serverError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 border-t border-[#1E293B]"
                style={{
                  background: "linear-gradient(135deg,#0F172A,#0A0F1E)",
                }}
              >
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:from-violet-600 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Submit Feedback
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
