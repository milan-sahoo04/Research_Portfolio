import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  MessageSquare,
  Microscope,
  Lock,
  Settings,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { NAV_LINKS, APP_NAME } from "../../utils/constants";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  // Secret: click logo 5x fast → go to login
  const handleLogoClick = () => {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 5) {
      setAdminClicks(0);
      navigate("/login");
    }
    setTimeout(() => setAdminClicks(0), 3000);
  };

  // Reusable Avatar component
  const Avatar = ({ size = "md" }) => {
    const sizeClass =
      size === "sm"
        ? "w-7 h-7 text-xs"
        : size === "lg"
          ? "w-10 h-10 text-sm"
          : "w-8 h-8 text-xs";

    if (user?.profile_pic) {
      return (
        <img
          src={user.profile_pic}
          alt={user?.name || "User"}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-indigo-500/40`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-indigo-500/30`}
      >
        {user?.name?.[0]?.toUpperCase() || "U"}
      </div>
    );
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "navbar-glass shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="section-wrapper">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-blue transition-all duration-300">
                <Microscope size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">
                {APP_NAME}
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-indigo-400"
                        : "text-secondary hover:text-primary hover:bg-white/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Chat icon */}
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-xl hidden sm:flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid var(--border)",
                  }}
                  aria-label="Chat"
                >
                  <MessageSquare size={16} className="text-indigo-400" />
                </motion.button>
              </Link>

              {/* Admin lock icon — only visible to admin */}
              {/* Lock icon — only renders for admin */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300"
                  aria-label="Admin panel"
                >
                  <Lock size={13} className="text-indigo-400" />
                </Link>
              )}

              {isAuthenticated ? (
                /* ── Round profile avatar + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setProfileOpen((o) => !o)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative focus:outline-none"
                    aria-label="Profile"
                  >
                    <Avatar size="md" />
                    {/* Green online dot */}
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2"
                      style={{ borderColor: "var(--bg-primary)" }}
                    />
                    {/* Admin badge */}
                    {isAdmin && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow">
                        <span
                          className="text-white font-bold"
                          style={{ fontSize: "8px" }}
                        >
                          A
                        </span>
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-3 w-56 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        {/* Profile header */}
                        <div
                          className="p-4 border-b flex items-center gap-3"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <Avatar size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold text-primary truncate">
                                {user?.name}
                              </p>
                              {isAdmin && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold flex-shrink-0">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2 space-y-0.5">
                          {isAdmin && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-indigo-500/10 transition-colors"
                            >
                              <LayoutDashboard
                                size={15}
                                className="text-indigo-400"
                              />
                              Admin Dashboard
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                          >
                            <User size={15} />
                            My Profile
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                          >
                            <Settings size={15} />
                            Settings
                          </Link>
                        </div>

                        {/* Sign out */}
                        <div
                          className="p-2 border-t"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Not logged in ── */
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn-primary text-sm px-4 py-2">
                    <span>Get Started</span>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setMobileOpen((o) => !o)}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
              style={{
                background: "var(--bg-card)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              {/* Drawer header — shows avatar if logged in */}
              <div
                className="flex items-center justify-between p-5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar size="md" />
                      <span
                        className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border-2"
                        style={{ borderColor: "var(--bg-card)" }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary leading-tight">
                        {user?.name?.split(" ")[0]}
                      </p>
                      <p className="text-xs text-muted">
                        {isAdmin ? "Administrator" : "Member"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="font-display font-bold gradient-text">
                    {APP_NAME}
                  </span>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-indigo-500/15 text-indigo-400"
                            : "text-secondary hover:text-primary hover:bg-white/5"
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
                {isAdmin && (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-500/10"
                  >
                    <LayoutDashboard size={15} />
                    Admin Dashboard
                  </NavLink>
                )}
              </nav>

              {/* Bottom */}
              <div
                className="p-4 border-t space-y-2"
                style={{ borderColor: "var(--border)" }}
              >
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary w-full justify-center text-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full justify-center text-sm"
                    >
                      <span>Get Started</span>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
