import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ─── Social link config ───────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/yourprofile",
    color: "hover:text-blue-500 hover:border-blue-500/40 hover:bg-blue-500/8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/yourprofile",
    color: "hover:text-gray-200 hover:border-gray-500/40 hover:bg-gray-500/8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    name: "Google Scholar",
    href: "https://scholar.google.com/citations?user=yourprofile",
    color: "hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 10a8 8 0 0 1 7.162 3.44L24 9.5z" />
      </svg>
    ),
  },
  {
    name: "ORCID",
    href: "https://orcid.org/0000-0000-0000-0000",
    color:
      "hover:text-green-400 hover:border-green-400/40 hover:bg-green-400/8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 3.872-2.944 3.872-3.722 0-2.184-1.284-3.722-3.872-3.722h-2.297z" />
      </svg>
    ),
  },
  {
    name: "ResearchGate",
    href: "https://researchgate.net/profile/yourprofile",
    color: "hover:text-teal-400 hover:border-teal-400/40 hover:bg-teal-400/8",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a12.096 12.096 0 0 0-.22 2.134v1.01c0 .61-.07 1.048-.207 1.316-.14.27-.41.404-.81.404h-.63v1.97h.63c.43 0 .71.138.84.412.13.276.197.758.197 1.443v1.074c0 .84.073 1.542.22 2.108.148.563.438 1.047.868 1.45.43.405 1.042.605 1.835.605.81 0 1.474-.175 1.99-.527V13.84c-.27.204-.574.305-.914.305-.283 0-.507-.068-.672-.207-.165-.137-.278-.35-.336-.635a5.93 5.93 0 0 1-.088-1.098v-1.064c0-.78-.12-1.404-.363-1.87-.24-.466-.627-.795-1.16-.987.56-.2.956-.53 1.19-1.004.23-.473.35-1.104.35-1.892V4.41c0-.43.03-.755.088-.972.057-.217.152-.37.286-.46.133-.087.32-.13.557-.13.3 0 .566.074.8.22V1.093C20.786.364 20.24 0 19.586 0zM4.227 4.01a.633.633 0 0 0-.633.633v5.43H7.44l2.137-2.97h-3.31V4.643a.633.633 0 0 0-.633-.633H4.227zm0 7.314a.633.633 0 0 0-.633.633v7.41h1.633v-4.43h3.09l2.145 4.43h1.82l-2.39-4.43h.196c1.47 0 2.613-.38 3.43-1.136.816-.758 1.224-1.8 1.224-3.13v-.347h-1.63v.347c0 .88-.24 1.556-.72 2.028-.48.472-1.166.708-2.056.708H5.493v-1.45a.633.633 0 0 0-.633-.633H4.227z" />
      </svg>
    ),
  },
  {
    name: "Email",
    href: "mailto:researcher@university.edu",
    color: "hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-400/8",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
];

// ─── Nav links ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    title: "Navigation",
    links: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Publications", to: "/publications" },
      { label: "Projects", to: "/projects" },
      { label: "Achievements", to: "/achievements" },
    ],
  },
  {
    title: "More",
    links: [
      { label: "Team", to: "/team" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      { label: "Admin", to: "/admin" },
    ],
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "24+", label: "Publications" },
  { value: "12+", label: "Projects" },
  { value: "6+", label: "Patents" },
  { value: "8+", label: "Collaborators" },
];

// ─── Scroll to top button ─────────────────────────────────────────────────────
const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  // Show after page loads (simple approach — add scroll listener in real app)
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.button
      onClick={handleClick}
      className="group flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-white transition-colors duration-200 shadow-lg"
      whileHover={{ y: -2, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </motion.button>
  );
};

// ─── Main Footer ──────────────────────────────────────────────────────────────
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.07, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <footer className="relative bg-gray-950 border-t border-gray-800/60 overflow-hidden">
      {/* ── Subtle background grid ── */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Glow accents ── */}
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-16 right-1/4 w-56 h-56 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        {/* ── Top section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            {/* Logo + name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">
                  Dr. Your Name
                </h3>
                <p className="text-gray-500 text-xs">
                  AI & Healthcare Researcher
                </p>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-sm">
              Advancing the frontiers of AI, healthcare informatics, and
              environmental intelligence. Building technology that makes a
              measurable difference.
            </p>

            {/* Affiliation badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700/60 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">
                Associate Professor · Your University
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                >
                  <p className="text-white font-extrabold text-lg leading-none mb-0.5">
                    {s.value}
                  </p>
                  <p className="text-gray-500 text-[10px] font-medium">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Nav columns */}
          {NAV_SECTIONS.map((section) => (
            <motion.div key={section.title} variants={itemVariants}>
              <h4 className="text-gray-300 font-semibold text-xs tracking-widest uppercase mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors duration-200"
                    >
                      <motion.span className="w-0 h-px bg-blue-500 group-hover:w-3 transition-all duration-200 inline-block" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="relative mb-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-gray-950">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
          </div>
        </div>

        {/* ── Social links ── */}
        <motion.div
          className="flex flex-wrap justify-center gap-2.5 mb-8"
          variants={itemVariants}
        >
          {SOCIAL_LINKS.map((s, i) => (
            <motion.a
              key={s.name}
              href={s.href}
              target={s.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={s.name}
              title={s.name}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-700/50 text-gray-500 bg-gray-900/50 text-xs font-medium transition-all duration-200 ${s.color}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.35 }}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {s.icon}
              <span>{s.name}</span>
            </motion.a>
          ))}
        </motion.div>

        {/* ── Bottom bar ── */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-800/50"
          variants={itemVariants}
        >
          {/* Copyright */}
          <p className="text-gray-600 text-xs text-center sm:text-left">
            © {currentYear} Dr. Your Name. All rights reserved.{" "}
            <span className="text-gray-700 mx-1">·</span>
            <span className="text-gray-600">Built with React & Supabase</span>
          </p>

          {/* Right side: links + scroll top */}
          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              to="/contact"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200"
            >
              Contact
            </Link>
            <div className="w-px h-4 bg-gray-800" />
            <ScrollTopButton />
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;
