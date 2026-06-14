// src/components/home/ContactSection.jsx
import { motion } from "framer-motion";
// ✅ Use these — all reliably available in current lucide-react
import { ArrowRight, Mail, ExternalLink, Globe, Send } from "lucide-react";
import { Link } from "react-router-dom";

const SOCIALS = [
  { icon: Globe, label: "GitHub", href: "https://github.com" },
  { icon: ExternalLink, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Send, label: "Email", href: "/contact" },
];
export default function ContactSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(17,24,39,0.95) 40%, rgba(59,130,246,0.12) 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          {/* Decorative corner orbs */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.04,
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-10 md:p-16 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Let's Collaborate
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-3xl md:text-5xl font-black tracking-tight mb-5"
              style={{ color: "#f8fafc" }}
            >
              Ready to Push the{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1, #3b82f6, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Boundaries?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-lg mx-auto mb-10 text-base leading-relaxed"
              style={{ color: "#94a3b8" }}
            >
              Whether you're a researcher, industry partner, or student — we'd
              love to hear from you. Let's build something extraordinary
              together.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-4 justify-center mb-10"
            >
              <Link
                to="/contact"
                className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                  boxShadow:
                    "0 0 32px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <Mail size={15} />
                Get in Touch
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>

              <Link
                to="/projects"
                className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#e2e8f0",
                  backdropFilter: "blur(8px)",
                }}
              >
                Browse Research
                <ExternalLink
                  size={13}
                  className="opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </Link>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-xs mx-auto mb-8"
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex items-center justify-center gap-3"
            >
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                    e.currentTarget.style.color = "#a5b4fc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
