// src/components/home/FeaturedProjects.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";

const COLORS = [
  {
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.25)",
    text: "#818cf8",
  },
  {
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    text: "#60a5fa",
  },
  {
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    text: "#a78bfa",
  },
];

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios
      .get("/projects?limit=3&sort=createdAt&order=desc")
      .catch(() => {})
      .then((res) => {
        if (res?.data?.success) setProjects(res.data.data.slice(0, 3));
      });
  }, []);

  const fallback = [
    {
      _id: "1",
      title: "Neural Architecture Search",
      category: "AI",
      description:
        "Automated discovery of optimal neural network architectures using reinforcement learning and evolutionary algorithms.",
      tags: ["PyTorch", "RL", "NAS"],
    },
    {
      _id: "2",
      title: "Multimodal Language Models",
      category: "ML",
      description:
        "Bridging vision and language understanding through unified transformer architectures trained on diverse datasets.",
      tags: ["Transformers", "Vision", "NLP"],
    },
    {
      _id: "3",
      title: "Federated Learning Platform",
      category: "Research",
      description:
        "Privacy-preserving distributed machine learning enabling collaboration without sharing sensitive data.",
      tags: ["Privacy", "Distributed", "FL"],
    },
  ];

  const display = projects.length ? projects : fallback;

  return (
    <section className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14"
        >
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Featured Work
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold mt-2"
              style={{ color: "#f8fafc" }}
            >
              Latest Research Projects
            </h2>
          </div>
          <Link
            to="/projects"
            className="group flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#6366f1" }}
          >
            View all projects
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {display.map((project, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col rounded-2xl p-6 cursor-pointer transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ border: `1px solid ${color.border}` }}
                />

                {/* Category badge */}
                <span
                  className="self-start text-xs font-semibold px-3 py-1 rounded-full mb-4"
                  style={{
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                >
                  {project.category}
                </span>

                <h3
                  className="text-lg font-bold mb-3 group-hover:text-indigo-400 transition-colors"
                  style={{ color: "#f1f5f9" }}
                >
                  {project.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1 mb-5"
                  style={{ color: "#64748b" }}
                >
                  {project.description?.slice(0, 120)}
                  {project.description?.length > 120 ? "…" : ""}
                </p>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          color: "#94a3b8",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Link
                  to={`/projects/${project._id}`}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: color.text }}
                >
                  View project <ExternalLink size={13} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
