// src/components/chat/ChatSidebar.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, X, Users } from "lucide-react";
import { useState } from "react";
import { useSocket } from "../../contexts/SocketContext";

export default function ChatSidebar({
  rooms,
  allUsers,
  activeId,
  onSelect,
  isAdmin,
  currentUserId,
}) {
  const [search, setSearch] = useState("");
  const { isOnline } = useSocket();

  const uniqueUsers = (allUsers || []).filter(
    (u, idx, arr) => arr.findIndex((x) => x.id === u.id) === idx,
  );

  const candidates = isAdmin
    ? uniqueUsers.filter((u) => u.id !== currentUserId)
    : uniqueUsers.filter((u) => u.role === "admin");

  const withRooms = candidates.map((u) => {
    const room = (rooms || []).find((r) => r.partner_id === u.id);
    return { ...u, room };
  });

  const sorted = [...withRooms].sort((a, b) => {
    if (a.room && !b.room) return -1;
    if (!a.room && b.room) return 1;
    if (a.room && b.room)
      return new Date(b.room.timestamp) - new Date(a.room.timestamp);
    return (a.name || "").localeCompare(b.name || "");
  });

  const filtered = sorted.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnread = sorted.reduce(
    (acc, u) => acc + (u.room?.unread_count || 0),
    0,
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "#0B1120",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              <MessageSquare size={14} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h2
                className="text-sm font-bold leading-none"
                style={{ color: "#e2e8f0" }}
              >
                Messages
              </h2>
              {totalUnread > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: "#6366f1" }}>
                  {totalUnread} unread
                </p>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#475569",
            }}
          >
            <Users size={10} />
            {filtered.length}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#475569" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-8 py-2.5 text-xs rounded-xl outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#e2e8f0",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(99,102,241,0.5)";
              e.target.style.background = "rgba(99,102,241,0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.07)";
              e.target.style.background = "rgba(255,255,255,0.04)";
            }}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={11} style={{ color: "#475569" }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mx-4 mb-2"
        style={{ height: "1px", background: "rgba(255,255,255,0.04)" }}
      />

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-3"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <MessageSquare size={20} style={{ color: "#4f46e5" }} />
              </div>
              <p className="text-xs text-center" style={{ color: "#475569" }}>
                No conversations yet
              </p>
            </motion.div>
          )}

          {filtered.map((u, i) => {
            const isActive = activeId === u.id;
            const online = isOnline(u.id);
            const unread = u.room?.unread_count || 0;
            const lastMsg = u.room?.last_message;
            const lastTime = u.room?.timestamp
              ? new Date(u.room.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            return (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.04,
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-150 group relative"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.12)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.25)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="chat-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{
                      background: "linear-gradient(180deg, #6366f1, #818cf8)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl overflow-hidden"
                    style={{
                      boxShadow: isActive
                        ? "0 0 0 2px rgba(99,102,241,0.4)"
                        : "none",
                    }}
                  >
                    {u.profile_pic ? (
                      <img
                        src={u.profile_pic}
                        alt={u.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-sm font-black"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                      >
                        {u.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  {online && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                      style={{
                        background: "#10b981",
                        borderColor: "#0B1120",
                        boxShadow: "0 0 6px rgba(16,185,129,0.5)",
                      }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className="text-sm font-semibold truncate"
                      style={{
                        color: isActive ? "#a5b4fc" : "#e2e8f0",
                      }}
                    >
                      {u.name}
                    </span>
                    {lastTime && (
                      <span
                        className="text-[10px] flex-shrink-0"
                        style={{
                          color: isActive ? "#6366f1" : "#334155",
                        }}
                      >
                        {lastTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className="text-xs truncate"
                      style={{
                        color: unread > 0 ? "#94a3b8" : "#334155",
                        fontWeight: unread > 0 ? 500 : 400,
                      }}
                    >
                      {lastMsg
                        ? u.room?.message_type !== "text"
                          ? "📎 Attachment"
                          : lastMsg
                        : u.role === "admin"
                          ? "Administrator"
                          : "Member"}
                    </p>
                    <AnimatePresence>
                      {unread > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(135deg, #6366f1, #818cf8)",
                            boxShadow: "0 0 8px rgba(99,102,241,0.4)",
                          }}
                        >
                          {unread > 9 ? "9+" : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
