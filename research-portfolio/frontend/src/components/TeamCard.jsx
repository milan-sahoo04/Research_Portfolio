import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLinkedin,
  FiGithub,
  FiMail,
  FiTwitter,
  FiGlobe,
  FiArrowUpRight,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";
import { HiAcademicCap, HiSparkles } from "react-icons/hi2";

// ─────────────────────────────────────────────
// ROLE COLOR CONFIG
// ─────────────────────────────────────────────
const ROLE_CONFIG = {
  "Principal Investigator": {
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-500/12",
    text: "text-amber-400",
    border: "border-amber-500/25",
    glow: "rgba(245,158,11,0.15)",
    icon: HiAcademicCap,
  },
  "PhD Student": {
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/12",
    text: "text-blue-400",
    border: "border-blue-500/25",
    glow: "rgba(59,130,246,0.15)",
    icon: HiAcademicCap,
  },
  "Postdoctoral Researcher": {
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-500/12",
    text: "text-violet-400",
    border: "border-violet-500/25",
    glow: "rgba(139,92,246,0.15)",
    icon: FiAward,
  },
  "Research Scientist": {
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/12",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    glow: "rgba(16,185,129,0.15)",
    icon: FiBookOpen,
  },
  "Research Engineer": {
    gradient: "from-cyan-500 to-sky-400",
    bg: "bg-cyan-500/12",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
    glow: "rgba(6,182,212,0.15)",
    icon: FiBookOpen,
  },
  "Masters Student": {
    gradient: "from-sky-500 to-blue-400",
    bg: "bg-sky-500/12",
    text: "text-sky-400",
    border: "border-sky-500/25",
    glow: "rgba(14,165,233,0.15)",
    icon: HiAcademicCap,
  },
  "Research Assistant": {
    gradient: "from-green-500 to-emerald-400",
    bg: "bg-green-500/12",
    text: "text-green-400",
    border: "border-green-500/25",
    glow: "rgba(34,197,94,0.15)",
    icon: HiAcademicCap,
  },
  Collaborator: {
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/12",
    text: "text-pink-400",
    border: "border-pink-500/25",
    glow: "rgba(236,72,153,0.15)",
    icon: HiSparkles,
  },
  Alumni: {
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/12",
    text: "text-slate-400",
    border: "border-slate-500/25",
    glow: "rgba(100,116,139,0.12)",
    icon: HiAcademicCap,
  },
  default: {
    gradient: "from-blue-500 to-indigo-400",
    bg: "bg-blue-500/12",
    text: "text-blue-400",
    border: "border-blue-500/25",
    glow: "rgba(59,130,246,0.15)",
    icon: HiAcademicCap,
  },
};

function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.default;
}

// ─────────────────────────────────────────────
// SOCIAL LINK BUTTON
// ─────────────────────────────────────────────
const SOCIAL_META = {
  linkedin: {
    icon: FiLinkedin,
    label: "LinkedIn",
    color: "hover:bg-[#0A66C2] hover:border-[#0A66C2]",
  },
  github: {
    icon: FiGithub,
    label: "GitHub",
    color: "hover:bg-slate-600 hover:border-slate-500",
  },
  email: {
    icon: FiMail,
    label: "Email",
    color: "hover:bg-emerald-600 hover:border-emerald-500",
  },
  twitter: {
    icon: FiTwitter,
    label: "Twitter / X",
    color: "hover:bg-slate-700 hover:border-slate-600",
  },
  website: {
    icon: FiGlobe,
    label: "Website",
    color: "hover:bg-blue-600 hover:border-blue-500",
  },
  scholar: {
    icon: FiBookOpen,
    label: "Google Scholar",
    color: "hover:bg-indigo-600 hover:border-indigo-500",
  },
};

function SocialButton({ type, href, delay = 0 }) {
  const meta = SOCIAL_META[type] || {
    icon: FiGlobe,
    label: type,
    color: "hover:bg-slate-600",
  };
  const Icon = meta.icon;
  const isEmail = type === "email";
  const finalHref = isEmail ? `mailto:${href}` : href;

  return (
    <motion.a
      href={finalHref}
      target={isEmail ? undefined : "_blank"}
      rel={isEmail ? undefined : "noopener noreferrer"}
      aria-label={meta.label}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.25,
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.92 }}
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center justify-center w-9 h-9 rounded-xl
        bg-white/10 border border-white/15 text-white/80
        ${meta.color} hover:text-white
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
    >
      <Icon size={15} />
    </motion.a>
  );
}

// ─────────────────────────────────────────────
// AVATAR — circular with shimmer ring
// ─────────────────────────────────────────────
function Avatar({ image, name, gradient, hovered }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex items-center justify-center">
      {/* Rotating gradient ring */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} blur-[2px]`}
        animate={{
          rotate: hovered ? 360 : 0,
          scale: hovered ? 1.08 : 1,
          opacity: hovered ? 1 : 0.5,
        }}
        transition={{
          rotate: {
            duration: 3,
            ease: "linear",
            repeat: hovered ? Infinity : 0,
          },
          scale: { duration: 0.4 },
          opacity: { duration: 0.3 },
        }}
        style={{ padding: "2px" }}
      />

      {/* White ring gap */}
      <div className="absolute inset-[2px] rounded-full bg-slate-900" />

      {/* Avatar image or initials */}
      <div className="relative w-full h-full rounded-full overflow-hidden">
        {image ? (
          <motion.img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-bold text-xl select-none`}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Active dot */}
      <motion.div
        className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPERTISE TAG
// ─────────────────────────────────────────────
function ExpertiseTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-slate-800 border border-white/8 text-slate-400">
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// STAT CHIP
// ─────────────────────────────────────────────
function StatChip({ value, label }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN TEAM CARD
// ─────────────────────────────────────────────
/**
 * TeamCard Props:
 * @param {string}   name          — Full name
 * @param {string}   role          — Role/title (maps to color config)
 * @param {string}   department    — e.g. "Computer Science", "Biomedical Engineering"
 * @param {string}   image         — Profile photo URL (optional, shows initials fallback)
 * @param {string}   bio           — Short biography (1–2 sentences)
 * @param {string[]} expertise     — Array of research areas/skills
 * @param {object}   socials       — { linkedin, github, email, twitter, website, scholar }
 * @param {number}   publications  — Publication count (optional)
 * @param {number}   citations     — Citation count (optional)
 * @param {string}   joinYear      — Year joined lab, e.g. "2021"
 * @param {boolean}  featured      — Highlight card (PI, featured member)
 * @param {number}   index         — Card index for stagger animation
 */
export default function TeamCard({
  name = "Team Member",
  role = "Researcher",
  department = null,
  image = null,
  bio = null,
  expertise = [],
  socials = {},
  publications = null,
  citations = null,
  joinYear = null,
  featured = false,
  index = 0,
}) {
  const [hovered, setHovered] = useState(false);
  const roleConfig = getRoleConfig(role);
  const RoleIcon = roleConfig.icon;

  const socialEntries = Object.entries(socials).filter(([, v]) => Boolean(v));
  const MAX_EXPERTISE = 3;
  const visibleExpertise = expertise.slice(0, MAX_EXPERTISE);
  const extraCount = expertise.length - MAX_EXPERTISE;
  const hasStats = publications !== null || citations !== null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.09,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group focus:outline-none"
      tabIndex={0}
      aria-label={`Team member: ${name}, ${role}`}
      role="article"
    >
      {/* Ambient glow */}
      <motion.div
        className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${roleConfig.gradient} blur-2xl pointer-events-none`}
        animate={{ opacity: hovered ? 0.18 : featured ? 0.08 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Card */}
      <motion.div
        className={`relative flex flex-col items-center rounded-2xl border overflow-hidden
          ${
            featured
              ? "border-amber-500/25 bg-slate-900/90"
              : "border-white/8 bg-slate-900/80"
          } backdrop-blur-sm`}
        animate={{
          boxShadow: hovered
            ? `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${roleConfig.glow}`
            : featured
              ? "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(245,158,11,0.1)"
              : "0 4px 16px rgba(0,0,0,0.2)",
          y: hovered ? -5 : 0,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Top gradient stripe */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${roleConfig.gradient} opacity-10`}
        />
        <motion.div
          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${roleConfig.gradient}`}
          animate={{ opacity: hovered ? 1 : featured ? 0.7 : 0.35 }}
          transition={{ duration: 0.3 }}
        />

        {/* Featured crown badge */}
        {featured && (
          <div className="absolute top-3 right-3 z-10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-amber-950 text-[10px] font-bold tracking-wide shadow-lg shadow-amber-500/30"
            >
              <HiSparkles size={9} />
              PI
            </motion.div>
          </div>
        )}

        {/* ── UPPER SECTION ── */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-5 w-full">
          {/* Avatar */}
          <div className="w-24 h-24 mb-4">
            <Avatar
              image={image}
              name={name}
              gradient={roleConfig.gradient}
              hovered={hovered}
            />
          </div>

          {/* Name */}
          <motion.h3
            className="text-base font-bold text-white text-center leading-snug font-display"
            animate={{ color: hovered ? "#bfdbfe" : "#ffffff" }}
            transition={{ duration: 0.2 }}
          >
            {name}
          </motion.h3>

          {/* Role badge */}
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
                ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border}`}
            >
              <RoleIcon size={11} />
              {role}
            </span>
          </div>

          {/* Department */}
          {department && (
            <p className="mt-1.5 text-[11px] text-slate-500 font-medium text-center tracking-wide">
              {department}
            </p>
          )}

          {/* Join year */}
          {joinYear && (
            <p className="mt-0.5 text-[10px] text-slate-600 font-medium">
              Since {joinYear}
            </p>
          )}
        </div>

        {/* ── STATS ROW ── */}
        {hasStats && (
          <>
            <div
              className="w-full h-px bg-white/6 mx-6"
              style={{ width: "calc(100% - 48px)" }}
            />
            <div className="flex items-center justify-center gap-8 py-4 w-full px-6">
              <StatChip value={publications} label="Papers" />
              {publications !== null && citations !== null && (
                <div className="w-px h-6 bg-white/8" />
              )}
              <StatChip
                value={citations !== null ? `${citations}+` : null}
                label="Citations"
              />
            </div>
          </>
        )}

        {/* ── HOVER OVERLAY ── */}
        <AnimatePresence>
          {hovered &&
            (bio ||
              socialEntries.length > 0 ||
              visibleExpertise.length > 0) && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full overflow-hidden"
              >
                <div className="w-full h-px bg-white/6" />
                <div className="px-6 py-5 flex flex-col gap-4">
                  {/* Bio */}
                  {bio && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="text-xs text-slate-400 leading-relaxed text-center"
                    >
                      {bio}
                    </motion.p>
                  )}

                  {/* Expertise tags */}
                  {visibleExpertise.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-wrap gap-1.5 justify-center"
                    >
                      {visibleExpertise.map((tag) => (
                        <ExpertiseTag key={tag} label={tag} />
                      ))}
                      {extraCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 border border-white/8 text-slate-500">
                          +{extraCount}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Social links */}
                  {socialEntries.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex items-center justify-center gap-2 flex-wrap"
                    >
                      {socialEntries.map(([type, href], i) => (
                        <SocialButton
                          key={type}
                          type={type}
                          href={href}
                          delay={i * 0.05}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* View profile link */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center"
                  >
                    <button
                      className={`flex items-center gap-1.5 text-xs font-semibold ${roleConfig.text} hover:underline underline-offset-2 transition-colors`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Full Profile
                      <FiArrowUpRight size={12} />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Bottom padding when not hovered and no overlay */}
        {!hovered && <div className="pb-5" />}

        {/* Shimmer sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="shimmer"
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "600%" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────
// USAGE EXAMPLE (delete in production)
// ─────────────────────────────────────────────
//
// import TeamCard from "@/components/TeamCard";
//
// <TeamCard
//   name="Dr. Priya Sharma"
//   role="Principal Investigator"
//   department="Computer Science & Engineering"
//   image="/images/team/priya.jpg"
//   bio="Dr. Sharma leads the AI & Biomedical Informatics lab with 12+ years of research in deep learning and computational biology."
//   expertise={["Deep Learning", "Bioinformatics", "NLP", "Computer Vision"]}
//   socials={{
//     linkedin: "https://linkedin.com/in/priyasharma",
//     github:   "https://github.com/priyasharma",
//     email:    "priya@university.edu",
//     scholar:  "https://scholar.google.com/citations?user=xxx",
//     website:  "https://priyasharma.dev",
//   }}
//   publications={87}
//   citations={2400}
//   joinYear="2015"
//   featured={true}
//   index={0}
// />
