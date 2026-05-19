// ─────────────────────────────────────────────────────────────────────────────
// backend/middleware/uploadMiddleware.js
// ─────────────────────────────────────────────────────────────────────────────

import multer from "multer";

// ─────────────────────────────────────────────
// ALL FILES GO TO MEMORY (buffer)
// Then forwarded to Supabase Storage in the controller
// Never written to disk
// ─────────────────────────────────────────────
const memoryStorage = multer.memoryStorage();

// ─────────────────────────────────────────────
// ALLOWED MIME TYPES
// ─────────────────────────────────────────────
const MIME_TYPES = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// ─────────────────────────────────────────────
// SIZE LIMITS
// ─────────────────────────────────────────────
const SIZE_LIMITS = {
  pdf: 20 * 1024 * 1024, // 20 MB — publications, achievements
  image: 5 * 1024 * 1024, // 5  MB — profile pics, blog covers, project images
  document: 20 * 1024 * 1024, // 20 MB — general documents
};

// ─────────────────────────────────────────────
// FILE FILTER FACTORY
// Creates a multer fileFilter for the given allowed types
// ─────────────────────────────────────────────
const makeFileFilter = (allowedMimes, label) => {
  return (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(`Invalid file type "${file.mimetype}". Allowed: ${label}.`),
        false,
      );
    }
  };
};

// ─────────────────────────────────────────────
// MULTER ERROR WRAPPER
// Wraps any multer middleware and converts errors
// to clean JSON responses instead of crashing Express.
//
// Usage:
//   router.post("/", withUpload(uploadPDF.single("pdf")), handler)
// ─────────────────────────────────────────────
export const withUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        const messages = {
          LIMIT_FILE_SIZE:
            "File too large. Check the size limit for this upload.",
          LIMIT_FILE_COUNT: "Too many files uploaded at once.",
          LIMIT_FIELD_KEY: "Field name is too long.",
          LIMIT_UNEXPECTED_FILE: `Unexpected field name. Use the correct field name for this upload.`,
        };
        return res.status(400).json({
          success: false,
          message: messages[err.code] || `Upload error: ${err.message}`,
          code: err.code,
        });
      }

      // Custom fileFilter errors
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    });
  };
};

// =============================================================================
// 1. PDF UPLOAD
// Used by: publications, achievements
// Field name: "pdf"
// =============================================================================
export const uploadPDF = multer({
  storage: memoryStorage,
  limits: { fileSize: SIZE_LIMITS.pdf },
  fileFilter: makeFileFilter(MIME_TYPES.pdf, "PDF only (.pdf)"),
});

// =============================================================================
// 2. IMAGE UPLOAD
// Used by: projects, blogs, team members, profile pictures
// Field name: "image"
// =============================================================================
export const uploadImage = multer({
  storage: memoryStorage,
  limits: { fileSize: SIZE_LIMITS.image },
  fileFilter: makeFileFilter(
    MIME_TYPES.image,
    "Images only (JPEG, PNG, WebP, GIF)",
  ),
});

// =============================================================================
// 3. PROFILE PICTURE UPLOAD
// Used by: users, team members
// Same as image but separate export for clarity
// Field name: "photo" or "profile_pic"
// =============================================================================
export const uploadProfilePic = multer({
  storage: memoryStorage,
  limits: { fileSize: SIZE_LIMITS.image },
  fileFilter: makeFileFilter(MIME_TYPES.image, "Images only (JPEG, PNG, WebP)"),
});

// =============================================================================
// 4. DOCUMENT UPLOAD (PDF or Word)
// Used by: achievements (certificates, patents)
// Field name: "document"
// =============================================================================
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: SIZE_LIMITS.document },
  fileFilter: makeFileFilter(
    MIME_TYPES.document,
    "PDF or Word document (.pdf, .doc, .docx)",
  ),
});

// =============================================================================
// 5. MIXED UPLOAD — PDF + Image in one request
// Used by: admin forms that upload both cover image + PDF together
// Fields: { pdf: single, image: single }
// =============================================================================
const mixedFileFilter = (_req, file, cb) => {
  const allAllowed = [...MIME_TYPES.pdf, ...MIME_TYPES.image];
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Allowed: PDF or image (JPEG, PNG, WebP).`,
      ),
      false,
    );
  }
};

export const uploadMixed = multer({
  storage: memoryStorage,
  limits: { fileSize: SIZE_LIMITS.pdf }, // use larger limit
  fileFilter: mixedFileFilter,
});

// ─────────────────────────────────────────────
// READY-TO-USE MIDDLEWARE (no wrapping needed)
// These are pre-composed with withUpload() so you
// can drop them straight into routes without extra boilerplate.
//
// Usage in routes:
//   import { uploadPDFMiddleware } from "../middleware/uploadMiddleware.js";
//   router.post("/admin", protect, uploadPDFMiddleware, createPublication);
// ─────────────────────────────────────────────

// Single PDF  — field name: "pdf"
export const uploadPDFMiddleware = withUpload(uploadPDF.single("pdf"));

// Single image — field name: "image"
export const uploadImageMiddleware = withUpload(uploadImage.single("image"));

// Single profile pic — field name: "photo"
export const uploadProfilePicMiddleware = withUpload(
  uploadProfilePic.single("photo"),
);

// Single document — field name: "document"
export const uploadDocumentMiddleware = withUpload(
  uploadDocument.single("document"),
);

// Mixed: one PDF + one image in same request
export const uploadMixedMiddleware = withUpload(
  uploadMixed.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
);

// ─────────────────────────────────────────────
// USAGE REFERENCE
// ─────────────────────────────────────────────
//
// OPTION A — pre-composed (simplest, recommended):
//
//   import { uploadPDFMiddleware } from "../middleware/uploadMiddleware.js";
//   router.post("/admin", protect, adminOnly, uploadPDFMiddleware, createPublication);
//   // req.file → the uploaded PDF buffer
//
//
// OPTION B — manual composition (more control):
//
//   import { uploadImage, withUpload } from "../middleware/uploadMiddleware.js";
//   router.post("/", protect, withUpload(uploadImage.single("image")), handler);
//   // req.file → the uploaded image buffer
//
//
// OPTION C — mixed fields:
//
//   import { uploadMixedMiddleware } from "../middleware/uploadMiddleware.js";
//   router.post("/admin", protect, adminOnly, uploadMixedMiddleware, handler);
//   // req.files.pdf[0]   → PDF buffer
//   // req.files.image[0] → image buffer
//
//
// IN YOUR CONTROLLERS access uploads via:
//   req.file         → single file upload (buffer, mimetype, originalname, size)
//   req.files        → fields upload (object keyed by field name)
//   req.file.buffer  → the raw bytes to pass to Supabase uploadFile()
