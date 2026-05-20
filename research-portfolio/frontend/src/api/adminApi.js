// src/api/adminApi.js
import axios from "./axios";

// ─── PROJECTS ─────────────────────────────────────────────
export const getProjectStatsApi = () =>
  axios.get("/projects/admin/stats").then((r) => r.data);
export const getAllProjectsAdminApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/projects/admin/all?${q}`).then((r) => r.data);
};
export const createProjectApi = (form) =>
  axios
    .post("/projects/admin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const updateProjectApi = (id, form) =>
  axios
    .put(`/projects/admin/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const deleteProjectApi = (id) =>
  axios.delete(`/projects/admin/${id}`).then((r) => r.data);
export const bulkDeleteProjectsApi = (ids) =>
  axios.delete("/projects/admin/bulk", { data: { ids } }).then((r) => r.data);
export const toggleProjectFeaturedApi = (id) =>
  axios.patch(`/projects/admin/${id}/featured`).then((r) => r.data);

// ─── BLOGS ────────────────────────────────────────────────
export const getBlogStatsApi = () =>
  axios.get("/blogs/admin/stats").then((r) => r.data);
export const getAllBlogsAdminApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/blogs/admin?${q}`).then((r) => r.data);
};
export const createBlogApi = (form) =>
  axios
    .post("/blogs/admin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const updateBlogApi = (id, data) =>
  axios.put(`/blogs/admin/${id}`, data).then((r) => r.data);
export const deleteBlogApi = (id) =>
  axios.delete(`/blogs/admin/${id}`).then((r) => r.data);
export const bulkDeleteBlogsApi = (ids) =>
  axios.delete("/blogs/admin/bulk", { data: { ids } }).then((r) => r.data);
export const toggleBlogFeaturedApi = (id) =>
  axios.put(`/blogs/admin/${id}/toggle-featured`).then((r) => r.data);
export const uploadBlogImageApi = (id, file) => {
  const form = new FormData();
  form.append("image", file);
  return axios
    .post(`/blogs/admin/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────
export const getAchievementStatsApi = () =>
  axios.get("/achievements/admin/stats").then((r) => r.data);
export const getAllAchievementsAdminApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/achievements/admin/all?${q}`).then((r) => r.data);
};
export const createAchievementApi = (form) =>
  axios
    .post("/achievements/admin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const updateAchievementApi = (id, form) =>
  axios
    .put(`/achievements/admin/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const deleteAchievementApi = (id) =>
  axios.delete(`/achievements/admin/${id}`).then((r) => r.data);
export const bulkDeleteAchievementsApi = (ids) =>
  axios
    .delete("/achievements/admin/bulk", { data: { ids } })
    .then((r) => r.data);

// ─── TEAM ─────────────────────────────────────────────────
export const getTeamStatsApi = () =>
  axios.get("/team/admin/stats").then((r) => r.data);
export const getAllTeamAdminApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/team/admin/all?${q}`).then((r) => r.data);
};
export const createTeamMemberApi = (form) =>
  axios
    .post("/team/admin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const updateTeamMemberApi = (id, form) =>
  axios
    .put(`/team/admin/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
export const deleteTeamMemberApi = (id) =>
  axios.delete(`/team/admin/${id}`).then((r) => r.data);
export const bulkDeleteTeamApi = (ids) =>
  axios.delete("/team/admin/bulk", { data: { ids } }).then((r) => r.data);
export const toggleTeamFeaturedApi = (id) =>
  axios.patch(`/team/admin/${id}/featured`).then((r) => r.data);
export const uploadTeamPicApi = (id, file) => {
  const form = new FormData();
  form.append("profile_pic", file);
  return axios
    .post(`/team/admin/${id}/profile-pic`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TO src/api/adminApi.js
// (append below your existing TEAM section)
// ─────────────────────────────────────────────────────────────────────────────

// ─── PUBLICATIONS ─────────────────────────────────────────
export const getPublicationStatsApi = () =>
  axios.get("/publications/admin/stats").then((r) => r.data);

export const getAllPublicationsAdminApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/publications/admin/all?${q}`).then((r) => r.data);
};

export const createPublicationApi = (form) =>
  axios
    .post("/publications/admin", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const updatePublicationApi = (id, form) =>
  axios
    .put(`/publications/admin/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const deletePublicationApi = (id) =>
  axios.delete(`/publications/admin/${id}`).then((r) => r.data);

export const bulkDeletePublicationsApi = (ids) =>
  axios
    .delete("/publications/admin/bulk", { data: { ids } })
    .then((r) => r.data);

export const togglePublicationFeaturedApi = (id, featured) =>
  axios
    .patch(`/publications/admin/${id}/${featured ? "unfeature" : "feature"}`)
    .then((r) => r.data);

// ─── FEEDBACK ─────────────────────────────────────────────
export const getFeedbackStatsApi = () =>
  axios.get("/feedback/admin/stats").then((r) => r.data);

export const getAllFeedbackApi = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return axios.get(`/feedback/admin?${q}`).then((r) => r.data);
};

export const deleteFeedbackApi = (id) =>
  axios.delete(`/feedback/admin/${id}`).then((r) => r.data);

export const bulkDeleteFeedbackApi = (ids) =>
  axios.delete("/feedback/admin/bulk", { data: { ids } }).then((r) => r.data);
