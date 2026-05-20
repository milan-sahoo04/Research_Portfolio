// src/components/home/ResearchStats.jsx
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RESEARCH_STATS } from "../../utils/constants";

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const ICONS = ["📄", "🚀", "🔬", "👥"];

export default function ResearchStats() {
  return (
    <section
      className="section-padding"
      style={{ background: "rgba(15,23,42,0.8)" }}
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#6366f1" }}
          >
            Our Impact
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mt-2"
            style={{ color: "#f8fafc" }}
          >
            Research by the Numbers
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RESEARCH_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative flex flex-col items-center justify-center p-8 rounded-2xl text-center overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(99,102,241,0.08) 0%, transparent 70%)",
                }}
              />
              <div className="text-3xl mb-3">{ICONS[i]}</div>
              <p
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
