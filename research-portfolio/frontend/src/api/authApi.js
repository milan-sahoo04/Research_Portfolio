// src/api/authApi.js
import axios from "./axios";

// ── Signup ──────────────────────────────────────────────
// POST /api/auth/signup
// Body: { name, email, password }
export const signupApi = async ({ name, email, password }) => {
  const { data } = await axios.post("/auth/signup", { name, email, password });
  return data; // { success, message, user }
};

// ── Login ────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
export const loginApi = async ({ email, password }) => {
  const { data } = await axios.post("/auth/login", { email, password });
  return data; // { success, message, accessToken, user }
};

// ── Logout ───────────────────────────────────────────────
// POST /api/auth/logout   (requires Bearer token)
export const logoutApi = async () => {
  const { data } = await axios.post("/auth/logout");
  return data; // { success, message }
};

// ── Get Me ───────────────────────────────────────────────
// GET /api/auth/me   (requires Bearer token)
export const getMeApi = async () => {
  const { data } = await axios.get("/auth/me");
  return data; // { success, user }
};

// ── Refresh Token ────────────────────────────────────────
// POST /api/auth/refresh   (reads httpOnly cookie automatically)
export const refreshTokenApi = async () => {
  const { data } = await axios.post("/auth/refresh");
  return data; // { success, accessToken, user }
};

// ── Verify Email ─────────────────────────────────────────
// GET /api/auth/verify-email?token=<token>
export const verifyEmailApi = async (token) => {
  const { data } = await axios.get(`/auth/verify-email?token=${token}`);
  return data; // { success, message }
};

// ── Forgot Password ──────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { email }
export const forgotPasswordApi = async (email) => {
  const { data } = await axios.post("/auth/forgot-password", { email });
  return data; // { success, message }
};

// ── Reset Password ───────────────────────────────────────
// POST /api/auth/reset-password
// Body: { token, newPassword, confirmPassword }
export const resetPasswordApi = async ({
  token,
  newPassword,
  confirmPassword,
}) => {
  const { data } = await axios.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
  return data; // { success, message }
};

// ── Change Password ──────────────────────────────────────
// PUT /api/auth/change-password   (requires Bearer token)
// Body: { currentPassword, newPassword, confirmPassword }
export const changePasswordApi = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const { data } = await axios.put("/auth/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return data; // { success, message }
};
