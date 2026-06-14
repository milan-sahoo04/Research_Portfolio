// src/components/home/ResearchStats.jsx
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RESEARCH_STATS } from "../../utils/constants";

// ─── Eased Counter ────────────────────────────────────────
function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4); // quartic ease-out
      setCount(Math.floor(ease * target));
      if (t < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Stat config with distinct accent colors per card
const STAT_ACCENTS = [
  { from: "#6366f1", to: "#818cf8", glow: "rgba(99,102,241,0.22)", icon: "◈" },
  { from: "#3b82f6", to: "#60a5fa", glow: "rgba(59,130,246,0.22)", icon: "⬡" },
  { from: "#8b5cf6", to: "#a78bfa", glow: "rgba(139,92,246,0.22)", icon: "◎" },
  { from: "#06b6d4", to: "#22d3ee", glow: "rgba(6,182,212,0.22)", icon: "◉" },
];

export default function ResearchStats() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle background pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)",
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
            Our Impact
          </div>
          <h2
            className="text-3xl md:text-5xl font-black tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Research{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              by the Numbers
            </span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {(RESEARCH_STATS.length
            ? RESEARCH_STATS
            : [
                { value: 120, suffix: "+", label: "Publications" },
                { value: 48, suffix: "+", label: "Projects" },
                { value: 15, suffix: "+", label: "Labs" },
                { value: 200, suffix: "+", label: "Collaborators" },
              ]
          ).map((stat, i) => {
            const accent = STAT_ACCENTS[i % STAT_ACCENTS.length];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 36, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative flex flex-col items-center justify-center p-8 rounded-2xl text-center overflow-hidden cursor-default"
                style={{
                  background: "var(--bg-card, rgba(255,255,255,0.03))",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Glow on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at center, ${accent.glow} 0%, transparent 65%)`,
                  }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-16 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-24 transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent.from}, transparent)`,
                  }}
                />

                {/* Decorative icon */}
                <div
                  className="text-2xl mb-4 select-none transition-transform duration-500 group-hover:scale-110"
                  style={{ color: accent.from, opacity: 0.7 }}
                >
                  {accent.icon}
                </div>

                {/* Counter */}
                <p
                  className="text-4xl md:text-5xl font-black mb-2 tabular-nums"
                  style={{
                    background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>

                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted, #64748b)" }}
                >
                  {stat.label}
                </p>

                {/* Bottom shimmer sweep on hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                  initial={false}
                  style={{
                    background: `linear-gradient(105deg, transparent 30%, ${accent.glow} 50%, transparent 70%)`,
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
