import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Phone,
  Microscope,
  ArrowUpRight,
  Heart,
  BookOpen,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "../../utils/constants";

const FOOTER_LINKS = {
  Research: [
    { label: "Projects", path: "/projects" },
    { label: "Publications", path: "/publications" },
    { label: "Achievements", path: "/achievements" },
    { label: "Blog", path: "/blogs" },
  ],
  Company: [
    { label: "About", path: "/about" },
    { label: "Team", path: "/team" },
    { label: "Contact", path: "/contact" },
    { label: "Join Us", path: "/signup" },
  ],
};

const SOCIAL = [
  {
    label: "GitHub",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/alok-kumar-pati-aba91421a/",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/a.l.o.k.p.a.t.i/",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=PjN3lCoAAAAJ&hl=en&oi=ao",
    icon: <BookOpen size={15} />,
  },
];

function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="divider-gradient" />

      <div className="section-wrapper py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Microscope size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">
                {APP_NAME}
              </span>
            </Link>

            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {APP_TAGLINE}. Pushing the boundaries of AI, machine learning, and
              data science through rigorous research and innovation.
            </p>

            <div className="space-y-2">
              {[
                {
                  Icon: Mail,
                  text: "alokpati065@gmail.com",
                  href: "mailto:alokpati065@gmail.com",
                },
                {
                  Icon: MapPin,
                  text: "At/Po- Ramachandrapur, Bhadrak, Odisha 756 114, India",
                  href: null,
                },
                { Icon: Phone, text: "+91 00000 00000", href: null },
              ].map(({ Icon, text, href }) => (
                <div
                  key={text}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Icon size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  {href ? (
                    <a
                      href={href}
                      className="hover:text-indigo-400 transition-colors duration-200 break-all"
                    >
                      {text}
                    </a>
                  ) : (
                    <span>{text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIAL.map(({ icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                    e.currentTarget.style.color = "#818CF8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="group flex items-center gap-1 text-sm transition-colors duration-200"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#818CF8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-secondary)")
                      }
                    >
                      <span>{label}</span>
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div
          className="mt-12 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div className="flex-1 text-center sm:text-left">
            <p
              className="font-display font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Stay updated with our research
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Get the latest papers, projects, and insights delivered to your
              inbox.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="input-premium text-sm flex-1 sm:w-56"
            />
            <button className="btn-primary text-sm px-4 py-2 shrink-0">
              <span>Subscribe</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p
            className="text-xs flex items-center gap-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Built with <Heart size={11} className="text-red-400 fill-red-400" />{" "}
            for the research community
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className="text-xs hover:text-indigo-400 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
