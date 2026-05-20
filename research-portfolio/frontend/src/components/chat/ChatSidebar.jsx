// src/components/chat/ChatSidebar.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, X } from "lucide-react";
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

  // Deduplicate allUsers by id first
  const uniqueUsers = (allUsers || []).filter(
    (u, idx, arr) => arr.findIndex((x) => x.id === u.id) === idx,
  );

  // Build candidates based on role
  const candidates = isAdmin
    ? uniqueUsers.filter((u) => u.id !== currentUserId)
    : uniqueUsers.filter((u) => u.role === "admin");

  // Merge room metadata into candidates
  const withRooms = candidates.map((u) => {
    const room = (rooms || []).find((r) => r.partner_id === u.id);
    return { ...u, room };
  });

  // Sort: users with existing rooms first (by latest message), then the rest
  const sorted = [...withRooms].sort((a, b) => {
    if (a.room && !b.room) return -1;
    if (!a.room && b.room) return 1;
    if (a.room && b.room) {
      return new Date(b.room.timestamp) - new Date(a.room.timestamp);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  const filtered = sorted.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{ borderRight: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-primary text-sm">Messages</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-[#111827] border border-[#1E293B] text-primary placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={11} className="text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-muted py-8"
            >
              No conversations yet
            </motion.p>
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
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(u)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-indigo-500/15 border border-indigo-500/20"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {u.profile_pic ? (
                      <img
                        src={u.profile_pic}
                        alt={u.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {u.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  {online && (
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                      style={{ borderColor: "var(--bg-primary)" }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm font-medium truncate ${isActive ? "text-indigo-300" : "text-primary"}`}
                    >
                      {u.name}
                    </span>
                    {lastTime && (
                      <span className="text-[10px] text-muted flex-shrink-0">
                        {lastTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-muted truncate">
                      {lastMsg
                        ? u.room?.message_type !== "text"
                          ? "📎 Attachment"
                          : lastMsg
                        : u.role === "admin"
                          ? "Administrator"
                          : "Member"}
                    </p>
                    {unread > 0 && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
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
