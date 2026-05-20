// src/api/userApi.js
import axios from "./axios";

// ── Get own profile ──────────────────────────────────────
export const getMyProfileApi = async () => {
  const { data } = await axios.get("/users/me");
  return data; // { success, data: user }
};

// ── Update own profile ───────────────────────────────────
export const updateMyProfileApi = async ({ name, bio, phone }) => {
  const { data } = await axios.put("/users/me", { name, bio, phone });
  return data; // { success, message, data: user }
};

// ── Upload own profile picture ───────────────────────────
export const uploadMyProfilePicApi = async (file) => {
  const form = new FormData();
  form.append("profile_pic", file);
  const { data } = await axios.post("/users/me/profile-pic", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { success, message, profile_pic, data: user }
};

// ── Delete own profile picture ───────────────────────────
export const deleteMyProfilePicApi = async () => {
  const { data } = await axios.delete("/users/me/profile-pic");
  return data;
};

// ── ADMIN: Get all users ─────────────────────────────────
export const getAllUsersApi = async ({
  page = 1,
  limit = 20,
  search = "",
  role = "",
  sort = "created_at",
  order = "desc",
  includeDeleted = false,
} = {}) => {
  const params = new URLSearchParams({ page, limit, sort, order });
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (includeDeleted) params.set("includeDeleted", "true");
  const { data } = await axios.get(`/users/admin?${params}`);
  return data; // { success, data: [], pagination }
};

// ── ADMIN: Get user by ID ────────────────────────────────
export const getUserByIdApi = async (id) => {
  const { data } = await axios.get(`/users/admin/${id}`);
  return data;
};

// ── ADMIN: Update any user ───────────────────────────────
export const updateUserApi = async (id, payload) => {
  const { data } = await axios.put(`/users/admin/${id}`, payload);
  return data;
};

// ── ADMIN: Delete user (soft) ────────────────────────────
export const deleteUserApi = async (id) => {
  const { data } = await axios.delete(`/users/admin/${id}`);
  return data;
};

// ── ADMIN: Bulk delete ───────────────────────────────────
export const bulkDeleteUsersApi = async (ids) => {
  const { data } = await axios.delete("/users/admin/bulk", { data: { ids } });
  return data;
};

// ── ADMIN: Restore deleted user ──────────────────────────
export const restoreUserApi = async (id) => {
  const { data } = await axios.put(`/users/admin/${id}/restore`);
  return data;
};

// ── ADMIN: Toggle active status ──────────────────────────
export const toggleUserStatusApi = async (id) => {
  const { data } = await axios.put(`/users/admin/${id}/toggle-status`);
  return data;
};

// ── ADMIN: Upload profile pic for any user ───────────────
export const uploadUserProfilePicApi = async (id, file) => {
  const form = new FormData();
  form.append("profile_pic", file);
  const { data } = await axios.post(`/users/admin/${id}/profile-pic`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Get admin users (accessible to all authenticated users) ──
export const getPublicAdminsApi = async () => {
  const { data } = await axios.get("/users?role=admin");
  return data;
};

// ── ADMIN: Delete profile pic for any user ───────────────
export const deleteUserProfilePicApi = async (id) => {
  const { data } = await axios.delete(`/users/admin/${id}/profile-pic`);
  return data;
};

// ── ADMIN: Get stats ─────────────────────────────────────
export const getUserStatsApi = async () => {
  const { data } = await axios.get("/users/admin/stats");
  return data; // { success, data: { total, active, ... } }
};

// ── Get admin list (accessible to all logged-in users, for chat) ─
export const getAdminsForChatApi = async () => {
  const { data } = await axios.get("/users/admins"); // non-admin route
  return data; // { success, data: [{ id, name, role, profile_pic }] }
};
