// src/components/home/Testimonials.jsx
import { motion } from "framer-motion";

const AREAS = [
  {
    icon: "🧠",
    title: "Deep Learning",
    desc: "Advancing neural network architectures for vision, language, and multimodal understanding.",
    color: "#6366f1",
  },
  {
    icon: "🔍",
    title: "Natural Language Processing",
    desc: "Building systems that understand, generate, and reason over human language at scale.",
    color: "#3b82f6",
  },
  {
    icon: "👁",
    title: "Computer Vision",
    desc: "Enabling machines to interpret and understand visual information from the world.",
    color: "#8b5cf6",
  },
  {
    icon: "🔒",
    title: "Privacy & Security",
    desc: "Federated learning and differential privacy for secure, collaborative AI systems.",
    color: "#06b6d4",
  },
  {
    icon: "🤖",
    title: "Reinforcement Learning",
    desc: "Training autonomous agents to solve complex sequential decision-making problems.",
    color: "#10b981",
  },
  {
    icon: "📊",
    title: "Data Science",
    desc: "Extracting insight from massive datasets through statistical and ML methods.",
    color: "#f59e0b",
  },
];

export default function Testimonials() {
  return (
    <section
      className="section-padding"
      style={{
        background:
          "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(99,102,241,0.04) 50%, rgba(15,23,42,0) 100%)",
      }}
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
            Expertise
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold mt-2"
            style={{ color: "#f8fafc" }}
          >
            Research Areas
          </h2>
          <p
            className="mt-3 max-w-xl mx-auto text-sm"
            style={{ color: "#64748b" }}
          >
            Our interdisciplinary team works across the full spectrum of AI and
            machine learning research.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="flex gap-4 p-5 rounded-2xl transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{
                  background: `${area.color}18`,
                  border: `1px solid ${area.color}30`,
                }}
              >
                {area.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "#f1f5f9" }}>
                  {area.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#64748b" }}
                >
                  {area.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
