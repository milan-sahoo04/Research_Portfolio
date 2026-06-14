// src/components/home/Testimonials.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const AREAS = [
  {
    icon: "⬡",
    title: "Deep Learning",
    desc: "Advancing neural network architectures for vision, language, and multimodal understanding at unprecedented scale.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.18)",
    tag: "Core Research",
  },
  {
    icon: "◈",
    title: "Natural Language Processing",
    desc: "Building systems that understand, generate, and reason over human language — from semantics to pragmatics.",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.18)",
    tag: "Language AI",
  },
  {
    icon: "◎",
    title: "Computer Vision",
    desc: "Enabling machines to interpret visual information — detection, segmentation, and 3D scene understanding.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.18)",
    tag: "Perception",
  },
  {
    icon: "◉",
    title: "Privacy & Security",
    desc: "Federated learning, differential privacy, and secure aggregation for trustworthy collaborative AI.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.18)",
    tag: "Trust & Safety",
  },
  {
    icon: "⊕",
    title: "Reinforcement Learning",
    desc: "Training autonomous agents to master complex sequential decision-making in dynamic environments.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.18)",
    tag: "Agents",
  },
  {
    icon: "⊞",
    title: "Data Science",
    desc: "Transforming massive, noisy datasets into insight through advanced statistical and ML methods.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.18)",
    tag: "Analytics",
  },
];

export default function Testimonials() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 50%, transparent 100%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(99,102,241,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.03,
        }}
      />

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "#a5b4fc",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Expertise
          </div>
          <h2
            className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Research{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Areas
            </span>
          </h2>
          <p
            className="max-w-xl mx-auto text-sm leading-relaxed"
            style={{ color: "var(--text-muted, #64748b)" }}
          >
            Our interdisciplinary team works across the full spectrum of AI and
            machine learning — from theory to deployment.
          </p>
        </motion.div>

        {/* Areas grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -5 }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="group relative p-6 rounded-2xl overflow-hidden cursor-default transition-all duration-300"
              style={{
                background: "var(--bg-card, rgba(255,255,255,0.03))",
                border: `1px solid ${
                  hovered === i ? `${area.color}40` : "rgba(255,255,255,0.07)"
                }`,
                transition: "border-color 0.3s ease",
              }}
            >
              {/* Background glow */}
              <AnimatePresence>
                {hovered === i && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: `radial-gradient(ellipse at top left, ${area.glow} 0%, transparent 65%)`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Top bar accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${area.color}, transparent)`,
                }}
              />

              <div className="relative z-10">
                {/* Icon + tag row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold select-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
                    style={{
                      background: `${area.color}18`,
                      border: `1px solid ${area.color}30`,
                      color: area.color,
                    }}
                  >
                    {area.icon}
                  </div>

                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{
                      background: `${area.color}12`,
                      color: area.color,
                      border: `1px solid ${area.color}25`,
                    }}
                  >
                    {area.tag}
                  </span>
                </div>

                <h3
                  className="font-bold text-base mb-2 transition-colors duration-300"
                  style={{
                    color:
                      hovered === i
                        ? area.color
                        : "var(--text-primary, #f1f5f9)",
                  }}
                >
                  {area.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted, #64748b)" }}
                >
                  {area.desc}
                </p>

                {/* Learn more */}
                <motion.div
                  className="flex items-center gap-1 mt-4 text-xs font-semibold"
                  style={{ color: area.color }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{
                    opacity: hovered === i ? 1 : 0,
                    x: hovered === i ? 0 : -8,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  Explore area <ArrowRight size={11} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
