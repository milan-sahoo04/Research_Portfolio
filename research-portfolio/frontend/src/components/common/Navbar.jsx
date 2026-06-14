// src/components/common/Navbar.jsx
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
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { NAV_LINKS, APP_NAME } from "../../utils/constants";

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }) {
  const sizeMap = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };
  const cls = sizeMap[size];
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user?.name || "User"}
        className={`${cls} rounded-full object-cover ring-2 ring-indigo-500/40`}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold ring-2 ring-indigo-500/30`}
    >
      {user?.name?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────
function DropdownItem({ to, icon: Icon, label, onClick, danger }) {
  const base =
    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150";
  const cls = danger
    ? `${base} text-red-400 hover:bg-red-500/10`
    : `${base} text-slate-400 hover:text-slate-200 hover:bg-white/6`;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls}>
        {Icon && (
          <Icon
            size={14}
            className={danger ? "text-red-400" : "text-slate-500"}
          />
        )}
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${cls} w-full`}>
      {Icon && (
        <Icon
          size={14}
          className={danger ? "text-red-400" : "text-slate-500"}
        />
      )}
      {label}
    </button>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const handleLogoClick = () => {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 5) {
      setAdminClicks(0);
      navigate("/login");
    }
    setTimeout(() => setAdminClicks(0), 3000);
  };

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={
          scrolled
            ? {
                background: "rgba(8,14,26,0.85)",
                backdropFilter: "blur(20px) saturate(1.6)",
                WebkitBackdropFilter: "blur(20px) saturate(1.6)",
                borderBottom: "1px solid rgba(99,102,241,0.1)",
                boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
              }
            : { background: "transparent" }
        }
      >
        {/* Top glow stripe — only when scrolled */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)",
              }}
            />
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}
                >
                  <Microscope size={15} className="text-white" />
                </div>
                {/* Blur glow */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              </div>
              <span
                className="font-display font-bold text-[17px] bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #e2e8f0 0%, #c7d2fe 100%)",
                }}
              >
                {APP_NAME}
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-indigo-300"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, #6366F1, #8B5CF6)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {/* Contact / chat icon */}
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-lg hidden sm:flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                  aria-label="Contact"
                >
                  <MessageSquare size={15} className="text-indigo-400" />
                </motion.button>
              </Link>

              {/* Admin lock */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="w-9 h-9 rounded-lg hidden sm:flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity duration-200"
                  aria-label="Admin panel"
                >
                  <Lock size={13} className="text-indigo-400" />
                </Link>
              )}

              {isAuthenticated ? (
                /* Profile avatar + dropdown */
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setProfileOpen((o) => !o)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative focus:outline-none flex items-center gap-1.5 pl-1"
                    aria-label="Profile menu"
                  >
                    <div className="relative">
                      <Avatar user={user} isAdmin={isAdmin} size="md" />
                      {/* Online dot */}
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                        style={{ borderColor: "var(--bg-primary, #080E1A)" }}
                      />
                      {/* Admin badge */}
                      {isAdmin && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/40">
                          <span
                            className="text-white font-bold"
                            style={{ fontSize: "8px" }}
                          >
                            A
                          </span>
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: profileOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={13}
                        className="text-slate-500 hidden sm:block"
                      />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-58 rounded-2xl overflow-hidden z-50"
                        style={{
                          width: "220px",
                          background: "rgba(15,23,42,0.95)",
                          backdropFilter: "blur(24px)",
                          WebkitBackdropFilter: "blur(24px)",
                          border: "1px solid rgba(99,102,241,0.15)",
                          boxShadow:
                            "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
                        }}
                      >
                        {/* Profile header */}
                        <div
                          className="p-4 pb-3"
                          style={{
                            borderBottom: "1px solid rgba(51,65,85,0.5)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar user={user} isAdmin={isAdmin} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-white truncate">
                                  {user?.name}
                                </p>
                                {isAdmin && (
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                                    style={{
                                      background: "rgba(99,102,241,0.2)",
                                      color: "#A5B4FC",
                                    }}
                                  >
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2 space-y-0.5">
                          {isAdmin && (
                            <DropdownItem
                              to="/admin/dashboard"
                              icon={LayoutDashboard}
                              label="Admin dashboard"
                              onClick={() => setProfileOpen(false)}
                            />
                          )}
                          <DropdownItem
                            to="/profile"
                            icon={User}
                            label="My profile"
                            onClick={() => setProfileOpen(false)}
                          />
                          <DropdownItem
                            to="/settings"
                            icon={Settings}
                            label="Settings"
                            onClick={() => setProfileOpen(false)}
                          />
                        </div>

                        {/* Sign out */}
                        <div
                          className="p-2 pt-1"
                          style={{ borderTop: "1px solid rgba(51,65,85,0.5)" }}
                        >
                          <DropdownItem
                            icon={LogOut}
                            label="Sign out"
                            onClick={handleLogout}
                            danger
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Auth CTAs */
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                  <Link to="/signup">
                    <motion.span
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200"
                      style={{
                        background:
                          "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                        boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
                      }}
                    >
                      Get started
                    </motion.span>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setMobileOpen((o) => !o)}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(30,41,59,0.7)",
                  border: "1px solid rgba(51,65,85,0.6)",
                }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {mobileOpen ? (
                      <X size={17} className="text-slate-300" />
                    ) : (
                      <Menu size={17} className="text-slate-300" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-50 lg:hidden flex flex-col"
              style={{
                background: "rgba(10,16,28,0.97)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between p-5"
                style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}
              >
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar user={user} isAdmin={isAdmin} size="md" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#0a101c]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">
                        {user?.name?.split(" ")[0]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isAdmin ? "Administrator" : "Member"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span
                    className="font-display font-bold text-sm bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #e2e8f0 0%, #c7d2fe 100%)",
                    }}
                  >
                    {APP_NAME}
                  </span>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500"
                  style={{ background: "rgba(30,41,59,0.7)" }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.04,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <NavLink
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "text-indigo-300 bg-indigo-500/12"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: NAV_LINKS.length * 0.04,
                      duration: 0.35,
                    }}
                  >
                    <NavLink
                      to="/admin/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-400"
                      style={{ background: "rgba(99,102,241,0.1)" }}
                    >
                      <LayoutDashboard size={14} />
                      Admin dashboard
                    </NavLink>
                  </motion.div>
                )}
              </nav>

              {/* Bottom actions */}
              <div
                className="p-3 space-y-2"
                style={{ borderTop: "1px solid rgba(51,65,85,0.5)" }}
              >
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 transition-colors"
                    style={{ border: "1px solid rgba(239,68,68,0.2)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239,68,68,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-all"
                      style={{
                        background: "rgba(30,41,59,0.7)",
                        border: "1px solid rgba(51,65,85,0.6)",
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{
                        background:
                          "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                        boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
                      }}
                    >
                      Get started
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
