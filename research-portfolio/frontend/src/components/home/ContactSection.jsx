// src/components/home/ContactSection.jsx
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactSection() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(59,130,246,0.15) 50%, rgba(139,92,246,0.2) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc",
              }}
            >
              Let's Collaborate
            </span>

            <h2
              className="text-3xl md:text-5xl font-bold mb-4"
              style={{ color: "#f8fafc" }}
            >
              Ready to Push the{" "}
              <span className="gradient-text">Boundaries?</span>
            </h2>

            <p
              className="max-w-lg mx-auto mb-10 text-base"
              style={{ color: "#94a3b8" }}
            >
              Whether you're a researcher, industry partner, or student — we'd
              love to hear from you. Let's build something extraordinary
              together.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/contact"
                className="group flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                  boxShadow: "0 0 24px rgba(79,70,229,0.4)",
                }}
              >
                <Mail size={16} />
                Get in Touch
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>

              <Link
                to="/projects"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0",
                }}
              >
                Browse Research
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              {[
                { label: "GH", title: "GitHub", href: "https://github.com" },
                {
                  label: "LI",
                  title: "LinkedIn",
                  href: "https://linkedin.com",
                },
                { label: "✉", title: "Email", href: "/contact" },
              ].map(({ label, title, href }) => (
                <a
                  key={title}
                  href={href}
                  aria-label={title}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 text-xs font-bold"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
