// src/pages/public/About.jsx
import { motion } from "framer-motion";
import { APP_NAME, APP_TAGLINE, RESEARCH_STATS } from "../../utils/constants";

const VALUES = [
  {
    icon: "🔬",
    title: "Rigorous Research",
    desc: "We hold every finding to the highest standards of scientific rigor and reproducibility.",
  },
  {
    icon: "🤝",
    title: "Open Collaboration",
    desc: "We believe the best ideas emerge from diverse minds working together across disciplines.",
  },
  {
    icon: "🌍",
    title: "Real-World Impact",
    desc: "Our research targets problems that matter — from healthcare to climate to education.",
  },
  {
    icon: "⚡",
    title: "Move Fast",
    desc: "We iterate rapidly, fail fast, and push toward results without compromising quality.",
  },
];

export default function About() {
  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: "var(--bg-primary, #0f172a)" }}
    >
      <div className="container-custom px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#6366f1" }}
          >
            About Us
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold mt-2 mb-6"
            style={{ color: "#f8fafc" }}
          >
            We are{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {APP_NAME}
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg" style={{ color: "#64748b" }}>
            {APP_TAGLINE}. Founded by a group of researchers who believed that
            AI could be both powerful and responsible, we've grown into a
            multidisciplinary lab tackling the hardest problems in machine
            intelligence.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-20">
          {RESEARCH_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <p
                className="text-3xl font-bold mb-1"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {stat.value.toLocaleString()}
                {stat.suffix}
              </p>
              <p className="text-sm" style={{ color: "#64748b" }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-10 md:p-16 mb-20 text-center"
          style={{
            background:
              "linear-gradient(135deg,rgba(79,70,229,0.12),rgba(59,130,246,0.08))",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: "#f8fafc" }}
          >
            Our Mission
          </h2>
          <p
            className="max-w-2xl mx-auto text-base leading-relaxed"
            style={{ color: "#94a3b8" }}
          >
            To accelerate scientific discovery through intelligent systems —
            building AI that augments human capability, advances knowledge, and
            benefits society at large. We publish openly, collaborate broadly,
            and measure success by the impact of our work in the real world.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-10"
            style={{ color: "#f8fafc" }}
          >
            Our Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "#f1f5f9" }}>
                  {v.title}
                </h3>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
