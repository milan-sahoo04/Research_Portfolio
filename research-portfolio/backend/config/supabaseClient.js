/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/config/supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ── Resolve .env from backend root (one level up from config/) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// ─────────────────────────────────────────────
// VALIDATE ENV ON STARTUP
// ─────────────────────────────────────────────
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
];

const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    `\n[Supabase] ❌ Missing required .env variables:\n  ${missing.join("\n  ")}\n`,
  );
  process.exit(1);
}

// ── Strip /rest/v1/ or trailing slash if pasted wrong ──
const SUPABASE_URL = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─────────────────────────────────────────────
// SHARED OPTIONS
// ─────────────────────────────────────────────
const SHARED_OPTIONS = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: { "x-app-name": "research-portfolio-backend" },
  },
};

// ─────────────────────────────────────────────
// 1. ANON CLIENT — respects RLS
// ─────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  ...SHARED_OPTIONS,
  db: { schema: "public" },
});

// ─────────────────────────────────────────────
// 2. ADMIN CLIENT — bypasses RLS
//    ⚠️  Never expose service_role key to frontend
// ─────────────────────────────────────────────
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { ...SHARED_OPTIONS, db: { schema: "public" } },
);

// ─────────────────────────────────────────────
// 3. USER-SCOPED CLIENT
//    Pass user JWT so RLS evaluates per-user
// ─────────────────────────────────────────────
export function createUserClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...SHARED_OPTIONS,
    global: {
      headers: {
        ...SHARED_OPTIONS.global.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// ─────────────────────────────────────────────
// 4. TABLE CONSTANTS
//    NOTE: your Supabase table is "team_members" not "team"
// ─────────────────────────────────────────────
export const TABLES = {
  USERS: "users",
  PROJECTS: "projects",
  PUBLICATIONS: "publications",
  ACHIEVEMENTS: "achievements",
  BLOGS: "blogs",
  TEAM: "team_members",
  FEEDBACK: "feedback",
  CHAT_MESSAGES: "chat_messages",
};

// ─────────────────────────────────────────────
// 5. STORAGE BUCKET NAMES
// ─────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  PROFILE_PICS: "profile-pics",
  PROJECT_FILES: "project-files",
  PUBLICATION_PDFS: "publication-pdf",
  ACHIEVEMENT_FILES: "achievement-files",
  BLOG_IMAGES: "blog-images",
};

// ─────────────────────────────────────────────
// 6. STORAGE HELPERS
// ─────────────────────────────────────────────

// uploadFile — uploads buffer to Supabase Storage
// Returns: publicUrl string (throws Error on failure)
// ── ONLY CHANGE from original ──
//   Previously returned publicUrl but was wrapped inconsistently.
//   Now always throws on error so callers use try/catch uniformly.
export async function uploadFile(bucket, filePath, buffer, mimeType) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `[Storage] Upload failed (${bucket}/${filePath}): ${error.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

// deleteFile — removes a file from Supabase Storage
// Returns: data (throws Error on failure)
export async function deleteFile(bucket, filePath) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(
      `[Storage] Delete failed (${bucket}/${filePath}): ${error.message}`,
    );
  }

  return data;
}

// deleteStorageFile — alias for deleteFile (backward compat)
export const deleteStorageFile = deleteFile;

// getSignedUrl — generates a time-limited signed URL for private files
// expiresIn: seconds (default 3600 = 1 hour)
export async function getSignedUrl(bucket, filePath, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`[Storage] Signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
}

// extractStoragePath — pulls the storage path out of a full public URL
// Useful when you need to delete a file and only have its public URL
export function extractStoragePath(publicUrl, bucket) {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error(`[Storage] Cannot extract path from URL: ${publicUrl}`);
  }
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

// ─────────────────────────────────────────────
// 7. CONNECTION HEALTH CHECK — call in server.js
// ─────────────────────────────────────────────
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id")
      .limit(1);

    if (error && error.code !== "PGRST116") throw new Error(error.message);

    console.log("[Supabase] ✅ Connected successfully.");
    console.log(`[Supabase] 🔗 ${SUPABASE_URL}`);
  } catch (err) {
    console.error("[Supabase] ❌ Connection failed:", err.message);
    console.error(
      "[Supabase] Fix: ensure SUPABASE_URL = https://yourproject.supabase.co (no /rest/v1/)",
    );
    throw err;
  }
}

// ─────────────────────────────────────────────
// 8. JWT + APP CONFIG EXPORTS
// ─────────────────────────────────────────────
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
export const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────
export default supabase;
