import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  MessageSquare,
  Microscope,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { NAV_LINKS, APP_NAME } from "../../utils/constants";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
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
            <Link to="/" className="flex items-center gap-2.5 group">
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

              {/* Chat icon (always visible) */}
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 hidden sm:flex"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid var(--border)",
                  }}
                  aria-label="Chat"
                >
                  <MessageSquare size={16} className="text-indigo-400" />
                </motion.button>
              </Link>

              {isAuthenticated ? (
                /* Profile dropdown */
                <div className="relative">
                  <motion.button
                    onClick={() => setProfileOpen((o) => !o)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-primary hidden sm:block">
                      {user?.name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-muted transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-card)",
                        }}
                        onMouseLeave={() => setProfileOpen(false)}
                      >
                        <div
                          className="p-3 border-b"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <p className="text-sm font-semibold text-primary">
                            {user?.name}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {user?.email}
                          </p>
                        </div>
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
                              Dashboard
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-white/5 transition-colors"
                          >
                            <User size={15} />
                            Profile
                          </Link>
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

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
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
              {/* Drawer header */}
              <div
                className="flex items-center justify-between p-5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="font-display font-bold gradient-text">
                  {APP_NAME}
                </span>
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
              </nav>

              {/* Auth buttons */}
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
