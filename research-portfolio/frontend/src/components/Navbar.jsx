import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiUser,
  FiBookOpen,
  FiCode,
  FiAward,
  FiUsers,
  FiFileText,
  FiMail,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiExternalLink,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

// ─────────────────────────────────────────────
// NAV LINKS CONFIGURATION
// ─────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home", path: "/", icon: FiHome },
  { label: "About", path: "/about", icon: FiUser },
  {
    label: "Research",
    icon: FiBookOpen,
    children: [
      { label: "Publications", path: "/publications", icon: FiBookOpen },
      { label: "Projects", path: "/projects", icon: FiCode },
      { label: "Achievements", path: "/achievements", icon: FiAward },
    ],
  },
  { label: "Team", path: "/team", icon: FiUsers },
  { label: "Blog", path: "/blog", icon: FiFileText },
  { label: "Contact", path: "/contact", icon: FiMail },
];

// ─────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────
const navbarVariants = {
  top: {
    backgroundColor: "rgba(15, 23, 42, 0)",
    backdropFilter: "blur(0px)",
    borderBottomColor: "rgba(255,255,255,0)",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
  },
  scrolled: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    backdropFilter: "blur(20px)",
    borderBottomColor: "rgba(59,130,246,0.15)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
};

const drawerVariants = {
  closed: { x: "100%", opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─────────────────────────────────────────────
// LOGO COMPONENT
// ─────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5 select-none">
      {/* Animated icon badge */}
      <motion.div
        className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden"
        whileHover={{ scale: 1.08, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-emerald-500" />
        {/* Animated shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <HiSparkles className="relative z-10 text-white text-lg" />
      </motion.div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className="font-bold text-base tracking-tight text-white font-display group-hover:text-blue-300 transition-colors duration-200">
          ResearchHub
        </span>
        <span className="text-[10px] font-medium text-blue-400/80 tracking-widest uppercase">
          Portfolio
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// DARK MODE TOGGLE
// ─────────────────────────────────────────────
function DarkModeToggle({ darkMode, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Toggle dark mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={darkMode ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          {darkMode ? <FiMoon size={16} /> : <FiSun size={16} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// DESKTOP DROPDOWN MENU
// ─────────────────────────────────────────────
function DropdownMenu({ item, isActive }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isChildActive = item.children?.some(
    (c) => c.path === location.pathname,
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${
            isChildActive
              ? "text-blue-400 bg-blue-500/10"
              : "text-slate-300 hover:text-white hover:bg-white/8"
          }`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <item.icon size={15} className="opacity-70" />
        {item.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown size={13} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 mt-2 w-52 origin-top-left"
          >
            {/* Glass card */}
            <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden py-1.5">
              {/* Gradient accent line */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              {item.children.map((child) => {
                const childActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`group flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150
                      ${
                        childActive
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-slate-300 hover:text-white hover:bg-white/6"
                      }`}
                    onClick={() => setOpen(false)}
                  >
                    <child.icon
                      size={15}
                      className={`transition-colors ${childActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"}`}
                    />
                    {child.label}
                    {childActive && (
                      <motion.div
                        layoutId="dropdown-active"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// DESKTOP NAV LINK
// ─────────────────────────────────────────────
function NavLink({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${
          isActive
            ? "text-blue-400 bg-blue-500/10"
            : "text-slate-300 hover:text-white hover:bg-white/8"
        }`}
    >
      <item.icon size={15} className="opacity-70" />
      {item.label}

      {/* Active indicator underline */}
      {isActive && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute bottom-0.5 left-3 right-3 h-px bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Hover glow */}
      {!isActive && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-emerald-500/0" />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────
// MOBILE DRAWER
// ─────────────────────────────────────────────
function MobileDrawer({ isOpen, onClose, darkMode, onToggleDarkMode }) {
  const location = useLocation();

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 z-50 w-[300px] flex flex-col"
          >
            {/* Glass background */}
            <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-2xl border-l border-white/8" />

            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
                <Logo />
                <motion.button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 text-slate-400 hover:text-white hover:bg-white/14 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  aria-label="Close menu"
                >
                  <FiX size={17} />
                </motion.button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-1"
                >
                  {NAV_LINKS.map((item) => {
                    if (item.children) {
                      return (
                        <motion.li key={item.label} variants={staggerItem}>
                          <MobileAccordion item={item} />
                        </motion.li>
                      );
                    }
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.li key={item.path} variants={staggerItem}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                            ${
                              isActive
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                : "text-slate-300 hover:text-white hover:bg-white/6"
                            }`}
                        >
                          <item.icon
                            size={16}
                            className={
                              isActive ? "text-blue-400" : "text-slate-500"
                            }
                          />
                          {item.label}
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </nav>

              {/* Footer */}
              <div className="px-5 py-5 border-t border-white/8 space-y-3">
                {/* Dark mode row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                    Appearance
                  </span>
                  <div className="flex items-center gap-2">
                    <FiSun size={13} className="text-slate-500" />
                    <button
                      onClick={onToggleDarkMode}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                        ${darkMode ? "bg-blue-600" : "bg-slate-600"}`}
                      aria-label="Toggle dark mode"
                    >
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow"
                        animate={{ x: darkMode ? 20 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    </button>
                    <FiMoon size={13} className="text-slate-500" />
                  </div>
                </div>

                {/* CTA button */}
                <Link
                  to="/contact"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow duration-200"
                >
                  <FiMail size={15} />
                  Get In Touch
                  <FiExternalLink size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// MOBILE ACCORDION FOR GROUPED LINKS
// ─────────────────────────────────────────────
function MobileAccordion({ item }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isChildActive = item.children.some((c) => c.path === location.pathname);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
          ${isChildActive ? "bg-blue-500/10 text-blue-400" : "text-slate-300 hover:text-white hover:bg-white/6"}`}
      >
        <item.icon
          size={16}
          className={isChildActive ? "text-blue-400" : "text-slate-500"}
        />
        {item.label}
        <motion.span
          className="ml-auto"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 pl-4 border-l border-white/10 space-y-1 pb-1">
              {item.children.map((child) => {
                const isActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${
                        isActive
                          ? "text-blue-400 bg-blue-500/10"
                          : "text-slate-400 hover:text-white hover:bg-white/6"
                      }`}
                  >
                    <child.icon
                      size={14}
                      className={isActive ? "text-blue-400" : "text-slate-600"}
                    />
                    {child.label}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCROLL PROGRESS BAR
// ─────────────────────────────────────────────
function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN NAVBAR COMPONENT
// ─────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") !== "false";
    }
    return true;
  });

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dark mode sync
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  return (
    <>
      {/* ── NAVBAR ── */}
      <motion.header
        variants={navbarVariants}
        animate={scrolled ? "scrolled" : "top"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-30 border-b"
        style={{ willChange: "background-color, box-shadow" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Logo />
            </motion.div>

            {/* Desktop navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="hidden md:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((item) =>
                item.children ? (
                  <DropdownMenu key={item.label} item={item} />
                ) : (
                  <NavLink key={item.path} item={item} />
                ),
              )}
            </motion.nav>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="flex items-center gap-2.5"
            >
              {/* Dark mode toggle — desktop */}
              <div className="hidden md:block">
                <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
              </div>

              {/* CTA Button — desktop */}
              <div className="hidden md:block">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <FiMail size={14} />
                    Contact
                  </Link>
                </motion.div>
              </div>

              {/* Hamburger — mobile */}
              <motion.button
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                aria-label="Open menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute"
                  >
                    <FiMenu size={18} />
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Scroll progress bar */}
        <ScrollProgressBar />
      </motion.header>

      {/* ── MOBILE DRAWER ── */}
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Spacer so page content isn't hidden under navbar */}
      <div className="h-16" />
    </>
  );
}
