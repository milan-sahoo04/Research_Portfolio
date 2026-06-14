import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Trophy,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Microscope,
  X,
  ChevronRight,
  BookOpen,
  Inbox,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../utils/constants";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    ],
  },
  {
    label: "Content",
    items: [
      { icon: FolderOpen, label: "Projects", path: "/admin/projects" },
      { icon: FileText, label: "Blogs", path: "/admin/blogs" },
      { icon: BookOpen, label: "Publications", path: "/admin/publications" },
      { icon: Trophy, label: "Achievements", path: "/admin/achievements" },
    ],
  },
  {
    label: "People",
    items: [
      { icon: Users, label: "Users", path: "/admin/users" },
      { icon: Users, label: "Team", path: "/admin/team" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { icon: MessageSquare, label: "Chat", path: "/admin/chat" },
      { icon: Inbox, label: "Feedback", path: "/admin/feedback" },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", path: "/admin/settings" }],
  },
];

// Single nav link
function NavItem({ icon: Icon, label, path, onClick }) {
  return (
    <NavLink to={path} onClick={onClick} className="group block">
      {({ isActive }) => (
        <motion.div
          className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer"
          style={{
            background: isActive ? "rgba(99,102,241,0.14)" : "transparent",
            color: isActive ? "#a5b4fc" : "#64748b",
            border: isActive
              ? "1px solid rgba(99,102,241,0.25)"
              : "1px solid transparent",
          }}
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#cbd5e1";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
            }
          }}
        >
          {/* Active left accent */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
              style={{
                background: "linear-gradient(180deg, #6366f1, #818cf8)",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <Icon
            size={16}
            style={{
              color: isActive ? "#818cf8" : "currentColor",
              flexShrink: 0,
            }}
          />
          <span className="flex-1 truncate">{label}</span>

          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <ChevronRight size={12} style={{ color: "#818cf8" }} />
            </motion.div>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}

function SidebarContent({ onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#0B1120" }}>
      {/* ── Logo ── */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              boxShadow: "0 0 16px rgba(79,70,229,0.35)",
            }}
          >
            <Microscope size={17} className="text-white" />
          </div>
          <div>
            <p
              className="text-sm font-black tracking-tight leading-none"
              style={{
                background: "linear-gradient(135deg, #a5b4fc, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {APP_NAME}
            </p>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
              style={{ color: "#334155" }}
            >
              Admin Panel
            </p>
          </div>
        </Link>

        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-white/5"
        >
          <X size={14} style={{ color: "#475569" }} />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#1e293b" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} onClick={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User + logout ── */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* User card */}
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 12px rgba(99,102,241,0.3)",
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate leading-tight"
              style={{ color: "#e2e8f0" }}
            >
              {user?.name || "Admin"}
            </p>
            <p
              className="text-[11px] truncate mt-0.5"
              style={{ color: "#475569" }}
            >
              {user?.email || "admin@researchlab.ai"}
            </p>
          </div>
          <Sparkles size={13} style={{ color: "#4f46e5", flexShrink: 0 }} />
        </div>

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
          style={{ color: "#ef4444" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <LogOut size={15} />
          Sign Out
        </motion.button>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 lg:hidden"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              className="fixed top-0 left-0 bottom-0 w-60 z-50 flex flex-col lg:hidden overflow-hidden"
              style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
