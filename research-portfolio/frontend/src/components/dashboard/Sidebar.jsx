import { NavLink, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../utils/constants";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: FolderOpen, label: "Projects", path: "/admin/projects" },
  { icon: FileText, label: "Blogs", path: "/admin/blogs" },
  { icon: Trophy, label: "Achievements", path: "/admin/achievements" },
  { icon: Users, label: "Team", path: "/admin/team" },
  { icon: MessageSquare, label: "Chat", path: "/admin/chat" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Microscope size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-base gradient-text">
            {APP_NAME}
          </span>
        </div>
        {/* Close on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <X size={15} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scroll">
        <p
          className="px-3 mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Menu
        </p>
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                  : "text-secondary hover:text-primary hover:bg-white/5 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={
                    isActive
                      ? "text-indigo-400"
                      : "text-muted group-hover:text-primary"
                  }
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-indigo-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2"
          style={{ background: "var(--bg-primary)" }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name || "Admin"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.email || "admin@researchlab.ai"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0"
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — slide in */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col lg:hidden"
            style={{
              background: "var(--bg-secondary)",
              borderRight: "1px solid var(--border)",
            }}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
