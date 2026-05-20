// src/pages/public/Contact.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import axios from "../../api/axios";

const INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "research@researchlab.ai",
    href: "mailto:research@researchlab.ai",
  },
  { icon: MapPin, label: "Location", value: "MIT CSAIL, Cambridge, MA" },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (617) 000-0000",
    href: "tel:+16170000000",
  },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await axios.post("/contact", form);
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f1f5f9",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="container-custom px-4">
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
            Get in Touch
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mt-2 mb-4"
            style={{ color: "#f8fafc" }}
          >
            Contact Us
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Have a question, collaboration idea, or just want to say hello?
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-5"
          >
            {INFO.map(({ icon: Icon, label, value, href }) => (
              <div
                key={label}
                className="flex gap-4 p-5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  <Icon size={16} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#475569" }}>
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm font-medium hover:text-indigo-400 transition-colors"
                      style={{ color: "#f1f5f9" }}
                    >
                      {value}
                    </a>
                  ) : (
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#f1f5f9" }}
                    >
                      {value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3 p-8 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-10 text-center">
                <CheckCircle size={48} style={{ color: "#34d399" }} />
                <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
                  Message Sent!
                </h3>
                <p style={{ color: "#64748b" }}>
                  We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    color: "#818cf8",
                  }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs mb-1.5"
                      style={{ color: "#64748b" }}
                    >
                      Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs mb-1.5"
                      style={{ color: "#64748b" }}
                    >
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ color: "#64748b" }}
                  >
                    Subject
                  </label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs mb-1.5"
                    style={{ color: "#64748b" }}
                  >
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell us more..."
                    style={{ ...inputStyle, resize: "none" }}
                  />
                </div>
                {error && (
                  <p className="text-sm" style={{ color: "#f87171" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg,#4f46e5,#3b82f6)",
                    boxShadow: "0 0 24px rgba(79,70,229,0.3)",
                  }}
                >
                  {sending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={15} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
