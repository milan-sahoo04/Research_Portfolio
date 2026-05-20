// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  FileText,
  Trophy,
  Users,
  TrendingUp,
  Star,
  Activity,
  MessageSquare,
  ArrowRight,
  Loader2,
  BookOpen,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserStatsApi } from "../../api/userApi";
import {
  getProjectStatsApi,
  getBlogStatsApi,
  getAchievementStatsApi,
  getTeamStatsApi,
  getFeedbackStatsApi,
  getPublicationStatsApi,
} from "../../api/adminApi";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay },
});

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, link, delay }) {
  const content = (
    <motion.div
      {...fade(delay)}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl border border-[#1E293B] p-5 overflow-hidden cursor-pointer group transition-all duration-300"
      style={{ background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)" }}
    >
      {/* Glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl bg-gradient-to-br ${gradient}`}
      />
      <div className="relative">
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}
        >
          <Icon size={19} className="text-white" />
        </div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-white mb-1">
          {value ?? (
            <Loader2 size={20} className="animate-spin text-slate-600" />
          )}
        </p>
        {sub && <p className="text-slate-600 text-xs">{sub}</p>}
      </div>
      {link && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className="text-slate-500" />
        </div>
      )}
    </motion.div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

// ─── Quick Link ───────────────────────────────────────────
function QuickLink({ icon: Icon, label, desc, to, gradient, delay }) {
  return (
    <motion.div {...fade(delay)}>
      <Link to={to}>
        <motion.div
          whileHover={{ x: 4 }}
          className="flex items-center gap-4 p-4 rounded-2xl border border-[#1E293B] hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200 group"
        >
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-slate-600 text-xs truncate">{desc}</p>
          </div>
          <ArrowRight
            size={15}
            className="text-slate-700 group-hover:text-indigo-400 transition-colors"
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getUserStatsApi(),
      getProjectStatsApi(),
      getBlogStatsApi(),
      getAchievementStatsApi(),
      getTeamStatsApi(),
      getFeedbackStatsApi(),
      getPublicationStatsApi(),
    ])
      .then(
        ([
          users,
          projects,
          blogs,
          achievements,
          team,
          feedback,
          publications,
        ]) => {
          setStats({
            users: users.status === "fulfilled" ? users.value?.data : null,
            projects:
              projects.status === "fulfilled" ? projects.value?.data : null,
            blogs: blogs.status === "fulfilled" ? blogs.value?.data : null,
            achievements:
              achievements.status === "fulfilled"
                ? achievements.value?.data
                : null,
            team: team.status === "fulfilled" ? team.value?.data : null,
            feedback:
              feedback.status === "fulfilled" ? feedback.value?.data : null,
            publications:
              publications.status === "fulfilled"
                ? publications.value?.data
                : null,
          });
        },
      )
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div {...fade(0)}>
        <div
          className="rounded-2xl border border-[#1E293B] p-6 overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg,#0F172A 0%,#0B1120 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 50%,rgba(99,102,241,0.08) 0%,transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-slate-500 text-sm mb-1">{greeting},</p>
              <h1 className="text-2xl font-bold text-white">
                {user?.name || "Admin"} 👋
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                {
                  label: "Active Users",
                  value: stats.users?.active ?? "—",
                  icon: UserCheck,
                  color: "text-emerald-400",
                },
                {
                  label: "New Today",
                  value: stats.users?.newToday ?? "—",
                  icon: TrendingUp,
                  color: "text-indigo-400",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="text-center px-5 py-3 rounded-xl border border-[#1E293B] bg-white/[0.02]"
                >
                  <div
                    className={`flex items-center gap-1.5 justify-center ${color} mb-1`}
                  >
                    <Icon size={13} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div>
        <motion.p
          {...fade(0.05)}
          className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4"
        >
          Overview
        </motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.users?.total}
            sub={`${stats.users?.active ?? 0} active`}
            gradient="from-indigo-500 to-blue-600"
            link="/admin/users"
            delay={0.07}
          />
          <StatCard
            icon={FolderOpen}
            label="Projects"
            value={stats.projects?.total}
            sub={`${stats.projects?.featured ?? 0} featured`}
            gradient="from-violet-500 to-purple-600"
            link="/admin/projects"
            delay={0.1}
          />
          <StatCard
            icon={FileText}
            label="Blog Posts"
            value={stats.blogs?.total}
            sub={`${stats.blogs?.published ?? stats.blogs?.featured ?? 0} published`}
            gradient="from-sky-500 to-cyan-600"
            link="/admin/blogs"
            delay={0.13}
          />
          <StatCard
            icon={Trophy}
            label="Achievements"
            value={stats.achievements?.total}
            sub="awards & grants"
            gradient="from-amber-500 to-orange-600"
            link="/admin/achievements"
            delay={0.16}
          />
          <StatCard
            icon={Users}
            label="Team Members"
            value={stats.team?.total}
            sub={`${stats.team?.featured ?? 0} featured`}
            gradient="from-emerald-500 to-teal-600"
            link="/admin/team"
            delay={0.19}
          />
          <StatCard
            icon={BookOpen}
            label="Publications"
            value={stats.publications?.total}
            sub={`${stats.publications?.featured ?? 0} featured`}
            gradient="from-violet-500 to-indigo-600"
            link="/admin/publications"
            delay={0.22}
          />
          <StatCard
            icon={MessageSquare}
            label="Feedback"
            value={stats.feedback?.total}
            sub={`${stats.feedback?.today ?? 0} today`}
            gradient="from-rose-500 to-pink-600"
            link="/admin/feedback"
            delay={0.25}
          />
          <StatCard
            icon={Activity}
            label="Verified Users"
            value={stats.users?.verified}
            sub="email verified"
            gradient="from-pink-500 to-rose-600"
            delay={0.28}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <motion.p
            {...fade(0.3)}
            className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4"
          >
            Manage Content
          </motion.p>
          <div className="space-y-2">
            {[
              {
                icon: FolderOpen,
                label: "Projects",
                desc: "Create, edit, delete research projects",
                to: "/admin/projects",
                gradient: "from-violet-500 to-purple-600",
                delay: 0.32,
              },
              {
                icon: FileText,
                label: "Blog Posts",
                desc: "Write and manage blog articles",
                to: "/admin/blogs",
                gradient: "from-sky-500 to-cyan-600",
                delay: 0.35,
              },
              {
                icon: Trophy,
                label: "Achievements",
                desc: "Awards, patents, fellowships",
                to: "/admin/achievements",
                gradient: "from-amber-500 to-orange-600",
                delay: 0.38,
              },
              {
                icon: Users,
                label: "Team",
                desc: "Manage researchers and faculty",
                to: "/admin/team",
                gradient: "from-emerald-500 to-teal-600",
                delay: 0.41,
              },
            ].map((p) => (
              <QuickLink key={p.to} {...p} />
            ))}
          </div>
        </div>
        <div>
          <motion.p
            {...fade(0.3)}
            className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4"
          >
            Manage Users & System
          </motion.p>
          <div className="space-y-2">
            {[
              {
                icon: Users,
                label: "User Management",
                desc: "View, edit, activate or delete users",
                to: "/admin/users",
                gradient: "from-indigo-500 to-blue-600",
                delay: 0.32,
              },
              {
                icon: BookOpen,
                label: "Publications",
                desc: "Manage research publications & PDFs",
                to: "/admin/publications",
                gradient: "from-violet-500 to-indigo-600",
                delay: 0.35,
              },
              {
                icon: MessageSquare,
                label: "Feedback",
                desc: "Read and respond to contact messages",
                to: "/admin/feedback",
                gradient: "from-rose-500 to-pink-600",
                delay: 0.38,
              },
              {
                icon: Activity,
                label: "Settings",
                desc: "Account and system preferences",
                to: "/admin/settings",
                gradient: "from-slate-500 to-slate-600",
                delay: 0.41,
              },
            ].map((p) => (
              <QuickLink key={p.to} {...p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
