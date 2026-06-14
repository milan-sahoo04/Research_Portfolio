// src/components/home/Hero.jsx
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import {
  TYPING_STRINGS,
  APP_TAGLINE,
  RESEARCH_STATS,
} from "../../utils/constants";
import ResearcherCard from "./ResearcherCard";

// ─── Particle Canvas ─────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? "99,102,241" : "59,130,246",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.55 }}
    />
  );
}

// ─── Animated Counter ────────────────────────────────────
function Counter({ value, suffix, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * value));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(value);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Magnetic Button ─────────────────────────────────────
function MagneticBtn({ children, className, style, to }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.25);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.25);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    </motion.div>
  );
}

// ─── Floating Orb ────────────────────────────────────────
function Orb({ style, delay = 0, size = 400 }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, ...style }}
      animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

// ─── Main Hero ───────────────────────────────────────────
export default function Hero() {
  const [typedText, setTypedText] = useState("");
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Typewriter
  useEffect(() => {
    const current = TYPING_STRINGS[stringIndex];
    const speed = deleting ? 35 : 75;
    const pause = 1800;

    const timer = setTimeout(() => {
      if (!deleting && charIndex < current.length) {
        setTypedText(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      } else if (!deleting && charIndex === current.length) {
        setTimeout(() => setDeleting(true), pause);
      } else if (deleting && charIndex > 0) {
        setTypedText(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      } else {
        setDeleting(false);
        setStringIndex((s) => (s + 1) % TYPING_STRINGS.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, deleting, stringIndex]);

  const stagger = (i) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Background layers ── */}
      <ParticleCanvas />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 30%, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)",
        }}
      />

      <Orb
        delay={0}
        size={500}
        style={{
          top: "-10%",
          left: "-8%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)",
        }}
      />
      <Orb
        delay={2}
        size={420}
        style={{
          bottom: "5%",
          right: "-5%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%)",
        }}
      />
      <Orb
        delay={4}
        size={280}
        style={{
          top: "30%",
          right: "12%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(99,102,241,0.25) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.04,
        }}
      />

      {/* ── Two-column layout ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 xl:gap-20">
          {/* ── LEFT: hero content ── */}
          <div className="flex-1 text-center lg:text-left min-w-0">
            {/* Live badge */}
            <motion.div
              {...stagger(0)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-7 text-sm font-semibold"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.28)",
                color: "#a5b4fc",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Advancing the Frontiers of Knowledge
              <Sparkles size={13} className="text-indigo-400" />
            </motion.div>

            {/* Main heading */}
            <motion.h1
              {...stagger(1)}
              className="text-5xl sm:text-6xl lg:text-7xl font-black mb-5 leading-[1.05] tracking-tight"
            >
              <span style={{ color: "var(--text-primary)" }}>Pioneering</span>
              <br />
              <span className="relative inline-block">
                <span
                  className="absolute inset-0 blur-2xl pointer-events-none"
                  style={{
                    background: "rgba(99,102,241,0.18)",
                    borderRadius: "999px",
                  }}
                />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1, #3b82f6, #22d3ee)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    position: "relative",
                  }}
                >
                  {typedText || "\u00A0"}
                </span>
                <motion.span
                  className="inline-block w-[3px] h-[0.85em] ml-1 align-middle rounded-sm"
                  style={{ background: "#6366f1", verticalAlign: "middle" }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              {...stagger(2)}
              className="text-lg md:text-xl mb-8 leading-relaxed max-w-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {APP_TAGLINE}. We build intelligent systems that solve real-world
              problems at the intersection of research and engineering.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              {...stagger(3)}
              className="flex flex-wrap gap-4 justify-center lg:justify-start mb-10"
            >
              <MagneticBtn
                to="/projects"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                  boxShadow:
                    "0 0 40px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <Zap size={17} className="text-yellow-300" />
                Explore Research
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </MagneticBtn>

              <MagneticBtn
                to="/team"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "var(--text-primary)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Globe size={16} style={{ color: "var(--text-secondary)" }} />
                Meet the Team
              </MagneticBtn>
            </motion.div>

            {/* Stats strip — capped width to stay in left column */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl max-w-lg"
              style={{
                border: "1px solid rgba(99,102,241,0.2)",
                background: "rgba(99,102,241,0.08)",
              }}
            >
              {RESEARCH_STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
                  className="flex flex-col items-center py-5 px-3 relative group"
                  style={{ background: "var(--bg-card)" }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 70%)",
                    }}
                  />
                  <p
                    className="text-2xl font-black mb-1"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest text-center leading-tight"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Researcher profile card ── */}
          <div className="flex-shrink-0 flex items-center justify-center w-full lg:w-auto">
            <ResearcherCard />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown size={17} />
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
      />
    </section>
  );
}
