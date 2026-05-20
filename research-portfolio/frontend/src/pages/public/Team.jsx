// src/pages/public/Team.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "../../api/axios";

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
                className="h-64 rounded-2xl animate-pulse"
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
            {members.map((member, i) => (
              <motion.div
                key={member._id}
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
                <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 ring-2 ring-indigo-500/20">
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
                  <p className="text-sm mb-2" style={{ color: "#6366f1" }}>
                    {member.role}
                  </p>
                )}
                {member.bio && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#64748b" }}
                  >
                    {member.bio?.slice(0, 80)}...
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
