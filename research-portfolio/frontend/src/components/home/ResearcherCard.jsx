// src/components/home/ResearcherCard.jsx
import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import AlokPhoto from "../../assets/images/Alok.avif";

// ─── Academic profile links ───────────────────────────────
const PROFILES = [
  {
    id: "scholar",
    label: "Google Scholar",
    value: "PjN3lCoAAAAJ",
    href: "https://scholar.google.com/citations?user=PjN3lCoAAAAJ&hl=en",
    color: "#4285F4",
    bgColor: "rgba(66,133,244,0.12)",
    borderColor: "rgba(66,133,244,0.3)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5h3.64v8.36C6 19.6 8.67 21 12 21c3.33 0 6-.4 8.36-3.14V9.5H24L12 0z" />
      </svg>
    ),
  },
  {
    id: "scopus",
    label: "Scopus",
    value: "View Profile",
    href: "https://www.scopus.com",
    color: "#F97316",
    bgColor: "rgba(249,115,22,0.12)",
    borderColor: "rgba(249,115,22,0.3)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
  },
  {
    id: "orcid",
    label: "ORCID",
    value: "0009-0009-4258-2997",
    href: "https://orcid.org/0009-0009-4258-2997",
    color: "#A6CE39",
    bgColor: "rgba(166,206,57,0.12)",
    borderColor: "rgba(166,206,57,0.3)",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c2.359 0 3.916-1.44 3.916-3.722 0-1.813-1.297-3.722-3.916-3.722h-2.297z" />
      </svg>
    ),
  },
];

// ─── Orbital SVG ring ────────────────────────────────────
function OrbitalRing({
  size,
  color,
  duration,
  delay,
  dasharray,
  reverse = false,
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute pointer-events-none"
      style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={dasharray}
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

// ─── Stat pill ────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2 rounded-xl"
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.18)",
      }}
    >
      <span
        className="text-lg font-black"
        style={{
          background: "linear-gradient(135deg,#6366f1,#22d3ee)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {value}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-widest mt-0.5"
        style={{ color: "rgba(148,163,184,0.7)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Profile badge ────────────────────────────────────────
function ProfileBadge({ profile, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={profile.href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.9 + index * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.02, x: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full"
      style={{
        background: hovered ? profile.bgColor : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? profile.borderColor : "rgba(255,255,255,0.07)"}`,
        transition: "background 0.2s, border-color 0.2s",
        textDecoration: "none",
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: hovered ? profile.bgColor : "rgba(255,255,255,0.05)",
          color: profile.color,
          transition: "background 0.2s",
        }}
      >
        {profile.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-semibold leading-none mb-0.5"
          style={{ color: "rgba(148,163,184,0.7)" }}
        >
          {profile.label}
        </p>
        <p
          className="text-[12px] font-mono truncate"
          style={{ color: hovered ? profile.color : "rgba(226,232,240,0.6)" }}
        >
          {profile.value}
        </p>
      </div>

      {/* Arrow */}
      <motion.svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        animate={{ x: hovered ? 1 : 0, opacity: hovered ? 1 : 0.3 }}
        transition={{ duration: 0.15 }}
        style={{ color: profile.color, flexShrink: 0 }}
      >
        <path
          d="M2 6h8M7 3l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.a>
  );
}

// ─── Main Card ────────────────────────────────────────────
export default function ResearcherCard() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateY.set(((e.clientX - cx) / rect.width) * 8);
    rotateX.set(-((e.clientY - cy) / rect.height) * 8);
  };
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const PHOTO_SIZE = 96;
  const RING1 = PHOTO_SIZE + 24;
  const RING2 = PHOTO_SIZE + 46;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, x: 48, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: springX,
            rotateY: springY,
            transformStyle: "preserve-3d",
            perspective: 800,
            /* Fixed width — wide enough for content */
            width: 280,
          }}
          className="relative select-none flex-shrink-0"
        >
          {/* Card body */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(10,15,30,0.98) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Top ambient glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />

            <div className="relative z-10 p-6 pb-5">
              {/* Photo + rings */}
              <div
                className="relative mx-auto mb-4 flex items-center justify-center"
                style={{ width: RING2, height: RING2 }}
              >
                <OrbitalRing
                  size={RING2}
                  color="rgba(99,102,241,0.35)"
                  duration={12}
                  delay={0}
                  dasharray="8 18"
                />
                <OrbitalRing
                  size={RING1}
                  color="rgba(59,130,246,0.4)"
                  duration={8}
                  delay={0}
                  dasharray="4 12"
                  reverse
                />

                {/* Orbiting dot */}
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 6,
                    height: 6,
                    background: "#6366f1",
                    boxShadow: "0 0 8px 2px rgba(99,102,241,0.8)",
                    top: "50%",
                    left: "50%",
                    transformOrigin: `${-RING2 / 2 + 3}px 0`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Photo */}
                <motion.div
                  className="relative rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    width: PHOTO_SIZE,
                    height: PHOTO_SIZE,
                    boxShadow:
                      "0 0 0 2px rgba(99,102,241,0.5), 0 0 24px rgba(99,102,241,0.2)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0 2px rgba(99,102,241,0.5), 0 0 24px rgba(99,102,241,0.15)",
                      "0 0 0 2px rgba(99,102,241,0.8), 0 0 32px rgba(99,102,241,0.35)",
                      "0 0 0 2px rgba(99,102,241,0.5), 0 0 24px rgba(99,102,241,0.15)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <AnimatePresence>
                    {!imageLoaded && (
                      <motion.div
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-blue-900/60"
                      />
                    )}
                  </AnimatePresence>
                  <img
                    src={AlokPhoto}
                    alt="Alok Kumar Pati — Principal Investigator"
                    className="w-full h-full object-cover object-top"
                    onLoad={() => setImageLoaded(true)}
                  />
                </motion.div>

                {/* Online indicator */}
                <motion.div
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2"
                  style={{ borderColor: "#0A0F1E" }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Name + title */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-center mb-1"
              >
                <h3 className="text-white font-bold text-base leading-tight tracking-tight">
                  Alok Kumar Pati
                </h3>
                <p
                  className="text-xs mt-1 font-medium"
                  style={{ color: "rgba(148,163,184,0.7)" }}
                >
                  Assistant Professor
                </p>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="w-full h-px my-4"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)",
                }}
              />

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="grid grid-cols-3 gap-2 mb-4"
              >
                <StatPill label="Papers" value="42+" />
                <StatPill label="Cites" value="1.2K" />
                <StatPill label="h-index" value="—" />
              </motion.div>

              {/* Academic profile links */}
              <div className="space-y-2">
                {PROFILES.map((profile, i) => (
                  <ProfileBadge key={profile.id} profile={profile} index={i} />
                ))}
              </div>
            </div>

            {/* Bottom shimmer line */}
            <motion.div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(59,130,246,0.3), transparent)",
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Glow shadow */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
