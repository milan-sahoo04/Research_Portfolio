// ─────────────────────────────────────────────────────────────────────────────
// backend/config/supabaseClient.js
// Supabase client configuration for backend (Node.js / Express)
// Two clients:
//   • supabase      → anon key (respects RLS — used for public/user operations)
//   • supabaseAdmin → service_role key (bypasses RLS — used for admin operations)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────
// VALIDATE REQUIRED ENV VARS ON STARTUP
// ─────────────────────────────────────────────
const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `[Supabase] ❌ Missing required environment variables:\n  ${missingEnv.join("\n  ")}`,
  );
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─────────────────────────────────────────────
// SHARED CLIENT OPTIONS
// ─────────────────────────────────────────────
const SHARED_OPTIONS = {
  auth: {
    autoRefreshToken: false, // Backend does not need token refresh
    persistSession: false, // No session persistence in Node
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "x-app-name": "research-portfolio-backend",
    },
  },
};

// ─────────────────────────────────────────────
// 1. ANON CLIENT  (respects Row Level Security)
//    Use for: public reads, user-scoped operations
// ─────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  ...SHARED_OPTIONS,
  db: {
    schema: "public",
  },
});

// ─────────────────────────────────────────────
// 2. ADMIN CLIENT  (bypasses Row Level Security)
//    Use for: admin CRUD, user management, server-side writes
//    ⚠️  Never expose this key to the frontend
// ─────────────────────────────────────────────
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    ...SHARED_OPTIONS,
    db: {
      schema: "public",
    },
  },
);

// ─────────────────────────────────────────────
// 3. CREATE USER-SCOPED CLIENT
//    Use for: passing the user's JWT so RLS policies
//    evaluate against the authenticated user
//    Call this inside route handlers after verifying JWT
// ─────────────────────────────────────────────
/**
 * Returns a Supabase client authenticated as the given user.
 * @param {string} accessToken — The user's JWT (from Authorization header)
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
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
// 4. STORAGE BUCKET NAMES
//    Centralised so you never hardcode bucket names
// ─────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  PROFILE_PICS: "profile-pics", // user / team profile images
  PROJECT_FILES: "project-files", // project PDFs, images, datasets
  PUBLICATION_PDFS: "publication-pdfs", // publication PDFs
  ACHIEVEMENT_FILES: "achievement-files", // certificates, patent docs
  BLOG_IMAGES: "blog-images", // blog cover images
};

// ─────────────────────────────────────────────
// 5. STORAGE HELPERS
// ─────────────────────────────────────────────

/**
 * Upload a file buffer to Supabase Storage.
 * @param {string} bucket      — Bucket name (use STORAGE_BUCKETS constants)
 * @param {string} path        — Path inside the bucket, e.g. "pdfs/file.pdf"
 * @param {Buffer} fileBuffer  — File content as a Node.js Buffer
 * @param {string} mimeType    — MIME type, e.g. "application/pdf"
 * @returns {Promise<string>}  — Public URL of the uploaded file
 */
export async function uploadFile(bucket, path, fileBuffer, mimeType) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `[Storage] Upload failed (${bucket}/${path}): ${error.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 * @param {string} bucket — Bucket name
 * @param {string} path   — File path inside the bucket
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(
      `[Storage] Delete failed (${bucket}/${path}): ${error.message}`,
    );
  }
}

/**
 * Generate a signed (temporary) URL for private bucket access.
 * @param {string} bucket      — Bucket name
 * @param {string} path        — File path inside the bucket
 * @param {number} expiresIn   — Expiry in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>}  — Signed URL
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(
      `[Storage] Signed URL failed (${bucket}/${path}): ${error.message}`,
    );
  }

  return data.signedUrl;
}

/**
 * Extract the storage path from a full Supabase public URL.
 * Useful when you store the public URL and later need to delete the file.
 * @param {string} publicUrl — Full public URL from Supabase Storage
 * @param {string} bucket    — Bucket name to strip from the URL
 * @returns {string}         — Relative path inside the bucket
 */
export function extractStoragePath(publicUrl, bucket) {
  // URL pattern: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error(`[Storage] Could not extract path from URL: ${publicUrl}`);
  }
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

// ─────────────────────────────────────────────
// 6. CONNECTION HEALTH CHECK
//    Called on server start to verify Supabase is reachable
// ─────────────────────────────────────────────
/**
 * Pings Supabase to confirm the connection is working.
 * Throws if the connection fails so the server exits early.
 */
export async function checkSupabaseConnection() {
  try {
    // A lightweight query — just fetch one row from any table
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned — that's fine, table exists
      throw new Error(error.message);
    }

    console.log("[Supabase] ✅ Connection established successfully.");
  } catch (err) {
    console.error("[Supabase] ❌ Connection failed:", err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
// 7. NAMED TABLE REFERENCES
//    Centralised table name constants — prevents typos in controllers
// ─────────────────────────────────────────────
export const TABLES = {
  USERS: "users",
  PROJECTS: "projects",
  PUBLICATIONS: "publications",
  ACHIEVEMENTS: "achievements",
  BLOGS: "blogs",
  TEAM: "team",
  FEEDBACK: "feedback",
  CHAT_MESSAGES: "chat_messages",
};

// ─────────────────────────────────────────────
// DEFAULT EXPORT — anon client (most common usage)
// ─────────────────────────────────────────────
export default supabase;
