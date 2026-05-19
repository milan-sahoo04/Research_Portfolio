/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/routes/chatRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import multer from "multer";
import { body } from "express-validator";

import { protect } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getChatRooms,
  getUnreadCount,
} from "../controllers/chatController.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MULTER — images + files, 10 MB max
// ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|doc|docx|zip|txt/;
    const ext = file.originalname.split(".").pop().toLowerCase();
    allowed.test(ext)
      ? cb(null, true)
      : cb(new Error(`File type .${ext} not allowed.`));
  },
});

// ─────────────────────────────────────────────
// VALIDATORS
// ─────────────────────────────────────────────
const sendValidators = [
  body("receiver_id")
    .notEmpty()
    .isUUID()
    .withMessage("receiver_id must be a valid UUID."),
  body("message_type")
    .optional()
    .isIn(["text", "image", "file"])
    .withMessage("message_type must be text, image, or file."),
  body("message")
    .if(body("message_type").equals("text"))
    .trim()
    .notEmpty()
    .withMessage("message is required for text messages."),
];

// ─────────────────────────────────────────────
// ALL CHAT ROUTES REQUIRE AUTH
// ─────────────────────────────────────────────
router.use(protect);

// ⚠️  Static routes MUST come before param routes to avoid /:param swallowing them

// GET  /api/chat/rooms           — list all conversations
router.get("/rooms", getChatRooms);

// GET  /api/chat/unread-count    — badge counter
router.get("/unread-count", getUnreadCount);

// POST /api/chat/send            — send text / image / file
router.post("/send", upload.single("attachment"), sendValidators, sendMessage);

// PATCH /api/chat/read/:senderId — mark room as read
router.patch("/read/:senderId", markAsRead);

// DELETE /api/chat/messages/:id  — delete own message (or admin)
router.delete("/messages/:id", deleteMessage);

// GET  /api/chat/messages/:receiverId  — paginated history  ⚠️ keep below statics
router.get("/messages/:receiverId", getMessages);

export default router;
