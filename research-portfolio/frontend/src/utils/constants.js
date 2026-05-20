export const APP_NAME = "ResearchLab";
export const APP_TAGLINE = "Where Curiosity Meets Innovation";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "Publications", path: "/publications" },
  { label: "Blogs", path: "/blogs" },
  { label: "Team", path: "/team" },
  { label: "Achievements", path: "/achievements" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Feedback", path: "/feedback" },
];

export const PROJECT_CATEGORIES = [
  "All",
  "AI",
  "ML",
  "Web",
  "Research",
  "Cloud",
  "Data",
];

export const BLOG_CATEGORIES = [
  "All",
  "AI",
  "Research",
  "Tutorial",
  "Opinion",
  "Case Study",
];

export const ACHIEVEMENT_TYPES = [
  "Award",
  "Patent",
  "Certification",
  "Grant",
  "Publication",
];

export const SOCIAL_LINKS = {
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com",
  scholar: "https://scholar.google.com",
};

export const TYPING_STRINGS = [
  "AI Research",
  "Machine Learning",
  "Full Stack Development",
  "Data Science",
  "Computer Vision",
  "Natural Language Processing",
];

export const RESEARCH_STATS = [
  { label: "Publications", value: 42, suffix: "+" },
  { label: "Projects", value: 28, suffix: "" },
  { label: "Citations", value: 1200, suffix: "+" },
  { label: "Team Members", value: 15, suffix: "" },
];
