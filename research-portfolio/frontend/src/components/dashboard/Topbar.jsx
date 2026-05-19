import { useLocation } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "../common/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_TITLES = {
  "/admin/dashboard": { title: "Dashboard", sub: "Welcome back" },
  "/admin/projects": { title: "Projects", sub: "Manage your projects" },
  "/admin/blogs": { title: "Blogs", sub: "Manage blog posts" },
  "/admin/achievements": { title: "Achievements", sub: "Awards & milestones" },
  "/admin/team": { title: "Team", sub: "Manage team members" },
  "/admin/chat": { title: "Chat", sub: "Live conversations" },
  "/admin/settings": { title: "Settings", sub: "Account & preferences" },
};

function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = PAGE_TITLES[pathname] || { title: "Admin", sub: "" };

  return (
    <header
      className="shrink-0 h-16 flex items-center justify-between px-6 border-b"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onMenuClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={17} style={{ color: "var(--text-secondary)" }} />
        </motion.button>

        <div>
          <h1
            className="text-base font-display font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {page.title}
          </h1>
          {page.sub && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {page.sub}
            </p>
          )}
        </div>
      </div>

      {/* Right: search + bell + theme */}
      <div className="flex items-center gap-2">
        {/* Search bar (desktop) */}
        <div
          className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl text-sm"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            minWidth: "200px",
          }}
        >
          <Search size={14} />
          <span className="text-xs">Search...</span>
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          aria-label="Notifications"
        >
          <Bell size={16} style={{ color: "var(--text-secondary)" }} />
          {/* Unread badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </motion.button>

        <ThemeToggle />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
