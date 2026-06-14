// src/pages/public/Team.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Award, Code2, Link as LinkIcon, AtSign } from "lucide-react";
import axios from "../../api/axios";

const ROLE_COLORS = {
  Researcher: {
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    text: "#a78bfa",
  },
  Faculty: {
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    text: "#fbbf24",
  },
  Student: {
    bg: "rgba(56,189,248,0.1)",
    border: "rgba(56,189,248,0.25)",
    text: "#38bdf8",
  },
};

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/team?limit=30")
      .then((res) => {
        if (res.data?.success) setMembers(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            The People
          </span>
          <h1
            className="text-4xl md:text-5xl font-bold mt-2 mb-4"
            style={{ color: "#f8fafc" }}
          >
            Our Team
          </h1>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Meet the researchers and engineers pushing the boundaries of AI.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#475569" }}>
            No team members found.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map((member, i) => {
              const rc = ROLE_COLORS[member.role] || ROLE_COLORS.Researcher;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center text-center p-6 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 ring-2 ring-indigo-500/20 flex-shrink-0">
                    {member.profile_pic ? (
                      <img
                        src={member.profile_pic}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold mb-1" style={{ color: "#f1f5f9" }}>
                    {member.name}
                  </h3>

                  {member.role && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium mb-3"
                      style={{
                        background: rc.bg,
                        color: rc.text,
                        border: `1px solid ${rc.border}`,
                      }}
                    >
                      {member.role}
                    </span>
                  )}

                  {member.bio && (
                    <p
                      className="text-xs leading-relaxed mb-3"
                      style={{ color: "#64748b" }}
                    >
                      {member.bio?.slice(0, 90)}
                      {member.bio?.length > 90 ? "..." : ""}
                    </p>
                  )}

                  {/* Expertise tags */}
                  {member.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                      {member.expertise.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full"
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

                  {/* Stats */}
                  {(member.publications != null ||
                    member.citations != null) && (
                    <div
                      className="flex items-center gap-4 mb-3 text-xs"
                      style={{ color: "#475569" }}
                    >
                      {member.publications != null && (
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={11} /> {member.publications} pubs
                        </span>
                      )}
                      {member.citations != null && (
                        <span className="flex items-center gap-1.5">
                          <Award size={11} /> {member.citations} cites
                        </span>
                      )}
                    </div>
                  )}

                  {/* Socials */}
                  {member.socials &&
                    Object.values(member.socials).some(Boolean) && (
                      <div className="flex items-center gap-2 mt-auto">
                        {member.socials.github && (
                          <a
                            href={member.socials.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              color: "#64748b",
                            }}
                          >
                            <Code2 size={13} />
                          </a>
                        )}
                        {member.socials.linkedin && (
                          <a
                            href={member.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              color: "#64748b",
                            }}
                          >
                            <LinkIcon size={13} />
                          </a>
                        )}
                        {member.socials.twitter && (
                          <a
                            href={member.socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              color: "#64748b",
                            }}
                          >
                            <AtSign size={13} />
                          </a>
                        )}
                      </div>
                    )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
