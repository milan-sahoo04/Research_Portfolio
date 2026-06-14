import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Bell,
  Search,
  X,
  ChevronRight,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_META = {
  "/admin/dashboard": { title: "Dashboard", sub: "Overview & analytics" },
  "/admin/projects": { title: "Projects", sub: "Manage research projects" },
  "/admin/blogs": { title: "Blogs", sub: "Manage blog posts" },
  "/admin/achievements": { title: "Achievements", sub: "Awards & milestones" },
  "/admin/team": { title: "Team", sub: "Manage team members" },
  "/admin/users": { title: "Users", sub: "All registered users" },
  "/admin/publications": {
    title: "Publications",
    sub: "Academic publications",
  },
  "/admin/feedback": { title: "Feedback", sub: "User feedback & reports" },
  "/admin/chat": { title: "Chat", sub: "Live conversations" },
  "/admin/settings": { title: "Settings", sub: "Account & preferences" },
};

// Notifications mock
const NOTIFICATIONS = [
  { id: 1, text: "New feedback submitted", time: "2m ago", dot: "#6366f1" },
  {
    id: 2,
    text: "Project 'Neural NAS' updated",
    time: "18m ago",
    dot: "#3b82f6",
  },
  { id: 3, text: "New user registered", time: "1h ago", dot: "#10b981" },
];

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const page = PAGE_META[pathname] || { title: "Admin", sub: "" };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/");
  };

  const dropdownBase = {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    zIndex: 50,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
    overflow: "hidden",
  };

  const dropdownVariants = {
    initial: { opacity: 0, y: -8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.97 },
  };

  return (
    <header
      className="shrink-0 h-16 flex items-center justify-between px-5 gap-4"
      style={{
        background: "#0B1120",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Hamburger */}
        <motion.button
          onClick={onMenuClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={16} style={{ color: "#64748b" }} />
        </motion.button>

        {/* Breadcrumb + title */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#334155" }}
            >
              Admin
            </span>
            <ChevronRight size={9} style={{ color: "#1e293b" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              {page.title}
            </span>
          </div>
          <motion.h1
            key={pathname}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-base font-black leading-none truncate"
            style={{ color: "#e2e8f0" }}
          >
            {page.title}
          </motion.h1>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search — desktop inline, mobile expand */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-open"
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="flex items-center gap-2 h-9 px-3 rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.4)",
              }}
            >
              <Search size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search anything…"
                className="flex-1 bg-transparent text-xs outline-none min-w-0"
                style={{ color: "#e2e8f0" }}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchVal("");
                }}
              >
                <X size={12} style={{ color: "#475569" }} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="search-closed"
              onClick={() => setSearchOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              aria-label="Search"
            >
              <Search size={15} style={{ color: "#64748b" }} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => {
              setNotifOpen((p) => !p);
              setProfileOpen(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: notifOpen
                ? "rgba(99,102,241,0.12)"
                : "rgba(255,255,255,0.04)",
              border: notifOpen
                ? "1px solid rgba(99,102,241,0.3)"
                : "1px solid rgba(255,255,255,0.07)",
            }}
            aria-label="Notifications"
          >
            <Bell
              size={15}
              style={{ color: notifOpen ? "#818cf8" : "#64748b" }}
            />
            {/* Ping badge */}
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span
                className="relative rounded-full h-2 w-2"
                style={{ background: "#6366f1" }}
              />
            </span>
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ ...dropdownBase, width: 300 }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                    Notifications
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(99,102,241,0.15)",
                      color: "#818cf8",
                    }}
                  >
                    {NOTIFICATIONS.length} new
                  </span>
                </div>

                {/* Items */}
                <div className="py-1">
                  {NOTIFICATIONS.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: n.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium leading-snug"
                          style={{ color: "#cbd5e1" }}
                        >
                          {n.text}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "#475569" }}
                        >
                          {n.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  className="px-4 py-2.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <button
                    className="text-xs font-semibold transition-colors"
                    style={{ color: "#6366f1" }}
                  >
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        {/* Profile avatar + dropdown */}
        <div className="relative" ref={profileRef}>
          <motion.button
            onClick={() => {
              setProfileOpen((p) => !p);
              setNotifOpen(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black cursor-pointer overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: profileOpen
                ? "0 0 0 2px #6366f1, 0 0 16px rgba(99,102,241,0.4)"
                : "0 0 12px rgba(99,102,241,0.25)",
              transition: "box-shadow 0.2s ease",
            }}
            aria-label="Profile menu"
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{ ...dropdownBase, width: 220 }}
              >
                {/* User info */}
                <div
                  className="px-4 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base mb-3"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      boxShadow: "0 0 16px rgba(99,102,241,0.3)",
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                    {user?.name || "Admin"}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "#475569" }}
                  >
                    {user?.email || "admin@researchlab.ai"}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1.5 px-2">
                  {[
                    {
                      icon: User,
                      label: "Profile",
                      action: () => {
                        setProfileOpen(false);
                        navigate("/admin/settings");
                      },
                    },
                    {
                      icon: Settings,
                      label: "Settings",
                      action: () => {
                        setProfileOpen(false);
                        navigate("/admin/settings");
                      },
                    },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ color: "#94a3b8" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "#e2e8f0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                <div
                  className="py-1.5 px-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{ color: "#ef4444" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
