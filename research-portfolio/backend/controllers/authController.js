/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/authController.js
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabaseAdmin, TABLES } from "../config/supabaseClient.js";
import { sendEmail } from "../utils/email.js";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const SALT_ROUNDS = 12;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// ── Hardcoded Admin (set these in .env) ──
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@researchportfolio.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

// ── Google OAuth (set these in .env) ──
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { ...safe } = user;
  return safe;
}

function ok(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...data });
}

function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────
// ADMIN BOOTSTRAP
// Auto-creates the admin row in DB on first login
// ─────────────────────────────────────────────
async function ensureAdminExists() {
  const { data: existing } = await supabaseAdmin
    .from(TABLES.USERS)
    .select("*")
    .eq("email", ADMIN_EMAIL.toLowerCase())
    .single();

  if (existing) return existing;

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  const { data: newAdmin, error } = await supabaseAdmin
    .from(TABLES.USERS)
    .insert({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      is_verified: true,
      is_active: true,
      verification_token: null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Admin bootstrap failed: ${error.message}`);
  console.log(`[Auth] ✅ Admin bootstrapped: ${ADMIN_EMAIL}`);
  return newAdmin;
}

// ─────────────────────────────────────────────
// 1. SIGNUP
// POST /api/auth/signup
// Body: { name, email, password }
// Only creates "user" role — admin is hardcoded
// ─────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim()) return fail(res, "Name is required.");
    if (!email?.trim()) return fail(res, "Email is required.");
    if (!password) return fail(res, "Password is required.");
    if (password.length < 8)
      return fail(res, "Password must be at least 8 characters.");

    const emailLower = email.toLowerCase().trim();

    // Block registration with hardcoded admin email
    if (emailLower === ADMIN_EMAIL.toLowerCase()) {
      return fail(
        res,
        "This email is reserved. Please use a different email.",
        409,
      );
    }

    const { data: existing } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id")
      .eq("email", emailLower)
      .single();

    if (existing) {
      return fail(res, "An account with this email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = jwt.sign({ email: emailLower }, JWT_SECRET, {
      expiresIn: "24h",
    });

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from(TABLES.USERS)
      .insert({
        name: name.trim(),
        email: emailLower,
        password: hashedPassword,
        role: "user", // always "user" — no role selection on signup
        is_verified: false,
        is_active: true,
        verification_token: verificationToken,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: emailLower,
      subject: "Verify your email — Research Portfolio",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;
          background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">Welcome, ${name.trim()}! 👋</h2>
          <p style="color:#94a3b8;margin-bottom:24px;">
            Please verify your email to activate your account.
          </p>
          <a href="${verifyUrl}"
            style="display:inline-block;padding:12px 28px;
            background:linear-gradient(135deg,#3b82f6,#10b981);
            color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
            Verify Email
          </a>
          <p style="color:#475569;font-size:12px;margin-top:24px;">
            This link expires in 24 hours.
          </p>
        </div>`,
    }).catch((e) =>
      console.warn("[Auth] Verification email failed:", e.message),
    );

    return ok(
      res,
      {
        message:
          "Account created! Please check your email to verify your account.",
        user: sanitizeUser(newUser),
      },
      201,
    );
  } catch (err) {
    console.error("[Auth] signup error:", err.message);
    return fail(res, "Signup failed. Please try again.", 500);
  }
};

// ─────────────────────────────────────────────
// 2. LOGIN  (regular users + admin via same route)
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) return fail(res, "Email is required.");
    if (!password) return fail(res, "Password is required.");

    const emailLower = email.toLowerCase().trim();

    // ── ADMIN PATH ──
    if (emailLower === ADMIN_EMAIL.toLowerCase()) {
      if (password !== ADMIN_PASSWORD) {
        return fail(res, "Invalid admin credentials.", 401);
      }

      const admin = await ensureAdminExists();

      // Sync password hash if ADMIN_PASSWORD changed in .env
      const hashMatch = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
      if (!hashMatch) {
        const newHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
        await supabaseAdmin
          .from(TABLES.USERS)
          .update({ password: newHash })
          .eq("id", admin.id);
        admin.password = newHash;
      }

      const { accessToken, refreshToken } = generateTokens(admin);
      const hashedRefresh = await bcrypt.hash(refreshToken, 10);

      await supabaseAdmin
        .from(TABLES.USERS)
        .update({
          refresh_token: hashedRefresh,
          last_login: new Date().toISOString(),
          is_verified: true,
          is_active: true,
        })
        .eq("id", admin.id);

      setRefreshCookie(res, refreshToken);
      console.log(`[Auth] 🔐 Admin login: ${emailLower}`);

      return ok(res, {
        message: "Admin logged in successfully.",
        accessToken,
        user: sanitizeUser(admin),
      });
    }

    // ── REGULAR USER PATH ──
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", emailLower)
      .single();

    if (error || !user) return fail(res, "Invalid email or password.", 401);

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return fail(res, "Invalid email or password.", 401);

    if (!user.is_verified) {
      return fail(res, "Please verify your email before logging in.", 403);
    }

    if (user.is_active === false) {
      return fail(
        res,
        "Your account has been deactivated. Contact support.",
        403,
      );
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        refresh_token: hashedRefresh,
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    setRefreshCookie(res, refreshToken);

    return ok(res, {
      message: "Logged in successfully.",
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("[Auth] login error:", err.message);
    return fail(res, "Login failed. Please try again.", 500);
  }
};

// ─────────────────────────────────────────────
// 3. GOOGLE OAUTH — Step 1: Redirect to Google
// GET /api/auth/google
// ─────────────────────────────────────────────
export const googleAuth = (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return fail(res, "Google OAuth is not configured on this server.", 501);
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${SERVER_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

// ─────────────────────────────────────────────
// 4. GOOGLE OAUTH — Step 2: Callback
// GET /api/auth/google/callback?code=...
// ─────────────────────────────────────────────
export const googleCallback = async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError || !code) {
      console.warn("[Auth] Google OAuth denied:", oauthError);
      return res.redirect(`${CLIENT_URL}/login?error=google_denied`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${CLIENT_URL}/login?error=oauth_not_configured`);
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SERVER_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("[Auth] Google token exchange failed:", tokenData.error);
      return res.redirect(`${CLIENT_URL}/login?error=google_token_failed`);
    }

    // Fetch Google user profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const googleUser = await profileRes.json();

    if (!googleUser.email) {
      return res.redirect(`${CLIENT_URL}/login?error=google_no_email`);
    }

    const emailLower = googleUser.email.toLowerCase();

    // Admin cannot use Google OAuth — must use email/password
    if (emailLower === ADMIN_EMAIL.toLowerCase()) {
      return res.redirect(`${CLIENT_URL}/login?error=admin_use_password`);
    }

    // Find or create user — always "user" role for Google OAuth
    let { data: user } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", emailLower)
      .single();

    if (!user) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          name: googleUser.name || emailLower.split("@")[0],
          email: emailLower,
          password: await bcrypt.hash(
            `google_${Date.now()}_${Math.random()}`,
            10,
          ),
          role: "user",
          is_verified: true,
          is_active: true,
          profile_pic: googleUser.picture || null,
          verification_token: null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createErr) {
        console.error("[Auth] Google user create error:", createErr.message);
        return res.redirect(
          `${CLIENT_URL}/login?error=account_creation_failed`,
        );
      }
      user = created;
      console.log(`[Auth] 🆕 Google user created: ${emailLower}`);
    } else {
      // Update profile pic if missing
      if (!user.profile_pic && googleUser.picture) {
        await supabaseAdmin
          .from(TABLES.USERS)
          .update({ profile_pic: googleUser.picture })
          .eq("id", user.id);
        user.profile_pic = googleUser.picture;
      }
    }

    if (user.is_active === false) {
      return res.redirect(`${CLIENT_URL}/login?error=account_deactivated`);
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        refresh_token: hashedRefresh,
        last_login: new Date().toISOString(),
        is_verified: true,
      })
      .eq("id", user.id);

    setRefreshCookie(res, refreshToken);
    console.log(`[Auth] ✅ Google login: ${emailLower}`);

    return res.redirect(
      `${CLIENT_URL}/dashboard?token=${accessToken}&provider=google`,
    );
  } catch (err) {
    console.error("[Auth] googleCallback error:", err.message);
    return res.redirect(`${CLIENT_URL}/login?error=google_failed`);
  }
};

// ─────────────────────────────────────────────
// 5. LOGOUT
// POST /api/auth/logout
// ─────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await supabaseAdmin
        .from(TABLES.USERS)
        .update({ refresh_token: null })
        .eq("id", req.user.id);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return ok(res, { message: "Logged out successfully." });
  } catch (err) {
    console.error("[Auth] logout error:", err.message);
    return fail(res, "Logout failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 6. GET ME
// GET /api/auth/me
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);
    return ok(res, { user: sanitizeUser(user) });
  } catch (err) {
    console.error("[Auth] getMe error:", err.message);
    return fail(res, "Could not fetch user.", 500);
  }
};

// ─────────────────────────────────────────────
// 7. REFRESH TOKEN
// POST /api/auth/refresh
// ─────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return fail(res, "No refresh token provided.", 401);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return fail(res, "Invalid or expired refresh token.", 401);
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("id", decoded.id)
      .single();

    if (error || !user || !user.refresh_token) {
      return fail(res, "Invalid refresh token.", 401);
    }

    const tokenMatch = await bcrypt.compare(token, user.refresh_token);
    if (!tokenMatch) return fail(res, "Invalid refresh token.", 401);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({ refresh_token: hashedRefresh })
      .eq("id", user.id);

    setRefreshCookie(res, newRefreshToken);
    return ok(res, { accessToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("[Auth] refreshToken error:", err.message);
    return fail(res, "Token refresh failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 8. VERIFY EMAIL
// GET /api/auth/verify-email?token=
// ─────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return fail(res, "Verification token is required.");

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return fail(res, "Verification link is invalid or has expired.", 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, is_verified, verification_token")
      .eq("email", decoded.email)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);
    if (user.is_verified) {
      return ok(res, {
        message: "Email is already verified. You can log in.",
      });
    }
    if (user.verification_token !== token) {
      return fail(res, "Invalid verification token.", 400);
    }

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({ is_verified: true, verification_token: null })
      .eq("id", user.id);

    return ok(res, {
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    console.error("[Auth] verifyEmail error:", err.message);
    return fail(res, "Email verification failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 9. FORGOT PASSWORD
// POST /api/auth/forgot-password
// Body: { email }
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return fail(res, "Email is required.");

    const emailLower = email.toLowerCase().trim();

    let user;
    if (emailLower === ADMIN_EMAIL.toLowerCase()) {
      user = await ensureAdminExists();
    } else {
      const { data } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("id, name, email")
        .eq("email", emailLower)
        .single();
      user = data;
    }

    // Same response regardless — prevents email enumeration
    if (!user) {
      return ok(res, {
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: emailLower },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
    const resetTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000,
    ).toISOString();

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      })
      .eq("id", user.id);

    const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log(`[Auth] Password reset URL (dev): ${resetUrl}`);

    await sendEmail({
      to: emailLower,
      subject: "Reset your password — Research Portfolio",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;
          background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <h2 style="color:#3b82f6;margin-bottom:8px;">Password Reset Request</h2>
          <p style="color:#94a3b8;">Hi ${user.name},</p>
          <p style="color:#94a3b8;margin-bottom:24px;">
            Click below to reset your password.
            This link expires in <strong style="color:#f59e0b;">1 hour</strong>.
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;padding:12px 28px;
            background:linear-gradient(135deg,#3b82f6,#10b981);
            color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
            Reset Password
          </a>
          <p style="color:#475569;font-size:12px;margin-top:24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>`,
    }).catch((e) => console.warn("[Auth] Reset email failed:", e.message));

    return ok(res, {
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[Auth] forgotPassword error:", err.message);
    return fail(res, "Password reset request failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 10. RESET PASSWORD
// POST /api/auth/reset-password
// Body: { token, newPassword, confirmPassword }
// ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) return fail(res, "Reset token is required.");
    if (!newPassword) return fail(res, "New password is required.");
    if (!confirmPassword) return fail(res, "Please confirm your new password.");
    if (newPassword !== confirmPassword) {
      return fail(res, "Passwords do not match.");
    }
    if (newPassword.length < 8) {
      return fail(res, "Password must be at least 8 characters.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return fail(res, "Reset link is invalid or has expired.", 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, reset_token, reset_token_expires, email")
      .eq("id", decoded.id)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);
    if (user.reset_token !== token) {
      return fail(res, "Invalid reset token.", 400);
    }
    if (new Date(user.reset_token_expires) < new Date()) {
      return fail(
        res,
        "Reset link has expired. Please request a new one.",
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      console.warn(
        "[Auth] ⚠️  Admin password reset via email. Update ADMIN_PASSWORD in .env too.",
      );
    }

    return ok(res, {
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("[Auth] resetPassword error:", err.message);
    return fail(res, "Password reset failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 11. CHANGE PASSWORD  (authenticated)
// PUT /api/auth/change-password
// Body: { currentPassword, newPassword, confirmPassword }
// ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword) return fail(res, "Current password is required.");
    if (!newPassword) return fail(res, "New password is required.");
    if (newPassword !== confirmPassword) {
      return fail(res, "Passwords do not match.");
    }
    if (newPassword.length < 8) {
      return fail(res, "New password must be at least 8 characters.");
    }
    if (currentPassword === newPassword) {
      return fail(res, "New password must be different from current password.");
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, password")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return fail(res, "User not found.", 404);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return fail(res, "Current password is incorrect.", 401);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await supabaseAdmin
      .from(TABLES.USERS)
      .update({
        password: hashedPassword,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return ok(res, {
      message: "Password changed successfully. Please log in again.",
    });
  } catch (err) {
    console.error("[Auth] changePassword error:", err.message);
    return fail(res, "Password change failed.", 500);
  }
};

// ─────────────────────────────────────────────
// 12. GET ADMIN INFO  (public — for login page)
// GET /api/auth/admin/info
// ─────────────────────────────────────────────
export const getAdminInfo = (_req, res) => {
  return ok(res, {
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    googleEnabled: Boolean(GOOGLE_CLIENT_ID),
  });
};
