/* eslint-disable no-undef */
// ─────────────────────────────────────────────────────────────────────────────
// backend/controllers/chatController.js
// ─────────────────────────────────────────────────────────────────────────────

import { validationResult } from "express-validator";
import {
  supabaseAdmin,
  TABLES,
  STORAGE_BUCKETS,
  uploadFile,
  deleteFile,
} from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// SCHEMA COLUMNS
// ─────────────────────────────────────────────
// id            uuid        NOT NULL  PK
// sender_id     uuid        NOT NULL  FK → users.id
// receiver_id   uuid        NOT NULL  FK → users.id
// room_id       text        NOT NULL  (derived: sorted sender+receiver UUIDs)
// message       text        nullable
// message_type  text        nullable  (text / image / file)
// is_read       bool        nullable  default false
// timestamp     timestamptz nullable
// updated_at    timestamptz nullable
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

const buildPagination = (page, limit, total) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

// Deterministic room ID — always same string regardless of who initiates
const buildRoomId = (userA, userB) => [userA, userB].sort().join("_");

const handleFileUpload = async (file, folder, bucket) => {
  const safeName = file.originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = `${folder}/${Date.now()}_${safeName}`;
  return await uploadFile(bucket, filePath, file.buffer, file.mimetype);
};

const CHAT_BUCKET = STORAGE_BUCKETS.PROJECT_FILES;

// =============================================================================
// @desc    Send a message (text, image, or file)
// @route   POST /api/chat/send
// @access  Private
// =============================================================================
export const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ success: false, errors: formatErrors(errors) });
    }

    const sender_id = req.user.id;
    const { receiver_id, message, message_type = "text" } = req.body;

    if (!receiver_id) {
      return res
        .status(400)
        .json({ success: false, message: "receiver_id is required." });
    }

    if (sender_id === receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Cannot send a message to yourself.",
      });
    }

    // ── Attachment upload ─────────────────────────────────────────────────────
    let attachmentUrl = null;
    if (req.file) {
      try {
        attachmentUrl = await handleFileUpload(
          req.file,
          `chat/${sender_id}`,
          CHAT_BUCKET,
        );
      } catch (uploadErr) {
        console.error("[Chat] Attachment upload error:", uploadErr.message);
        return res
          .status(500)
          .json({ success: false, message: "File upload failed." });
      }
    }

    if (message_type === "text" && !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required for text messages.",
      });
    }
    if (
      (message_type === "image" || message_type === "file") &&
      !attachmentUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "A file attachment is required for image/file messages.",
      });
    }

    const room_id = buildRoomId(sender_id, receiver_id);
    const now = new Date().toISOString();

    const { data: msg, error } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .insert([
        {
          sender_id,
          receiver_id,
          room_id,
          message:
            message_type === "text" ? message.trim() : (attachmentUrl ?? null),
          message_type,
          is_read: false,
          timestamp: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Chat] sendMessage DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send message." });
    }

    return res
      .status(201)
      .json({ success: true, message: "Message sent.", data: msg });
  } catch (err) {
    console.error("[Chat] sendMessage exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get messages in a room (paginated, oldest first)
// @route   GET /api/chat/messages/:receiverId
// @access  Private
// =============================================================================
export const getMessages = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const receiverId = req.params.receiverId ?? req.params.userId;
    const { page = 1, limit = 30 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const room_id = buildRoomId(sender_id, receiverId);

    const { data, error, count } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .select("*", { count: "exact" })
      .eq("room_id", room_id)
      .order("timestamp", { ascending: true })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error("[Chat] getMessages DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch messages." });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPagination(pageNum, limitNum, count ?? 0),
    });
  } catch (err) {
    console.error("[Chat] getMessages exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Mark all unread messages in a room as read
// @route   PATCH /api/chat/read/:senderId
// @access  Private
// =============================================================================
export const markAsRead = async (req, res) => {
  try {
    const receiver_id = req.user.id;
    const { senderId } = req.params;

    const room_id = buildRoomId(receiver_id, senderId);

    const { error, count } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("room_id", room_id)
      .eq("receiver_id", receiver_id)
      .eq("is_read", false)
      .select("id", { count: "exact" });

    if (error) {
      console.error("[Chat] markAsRead DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to mark messages as read." });
    }

    return res.status(200).json({
      success: true,
      message: `${count ?? 0} message(s) marked as read.`,
      updated: count ?? 0,
    });
  } catch (err) {
    console.error("[Chat] markAsRead exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Delete a message (sender only, or admin)
// @route   DELETE /api/chat/messages/:id
// @access  Private
// =============================================================================
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const { data: msg, error: fetchError } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .select("id, sender_id, message, message_type")
      .eq("id", id)
      .single();

    if (fetchError || !msg) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found." });
    }

    if (msg.sender_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to delete this message.",
      });
    }

    if (
      (msg.message_type === "image" || msg.message_type === "file") &&
      msg.message &&
      !msg.message.startsWith("http")
    ) {
      await deleteFile(CHAT_BUCKET, msg.message).catch(() => {});
    }

    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Chat] deleteMessage DB error:", deleteError.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete message." });
    }

    return res.status(200).json({ success: true, message: "Message deleted." });
  } catch (err) {
    console.error("[Chat] deleteMessage exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// =============================================================================
// @desc    Get all chat rooms (conversations) for the logged-in user
// @route   GET /api/chat/rooms
// @access  Private
// =============================================================================
export const getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .select(
        "room_id, sender_id, receiver_id, message, message_type, timestamp, is_read",
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("[Chat] getChatRooms DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch chat rooms." });
    }

    // Build room map
    const roomMap = new Map();
    const partnerIds = new Set();

    for (const row of data ?? []) {
      const partnerId =
        row.sender_id === userId ? row.receiver_id : row.sender_id;
      partnerIds.add(partnerId);

      if (!roomMap.has(row.room_id)) {
        roomMap.set(row.room_id, {
          room_id: row.room_id,
          partner_id: partnerId,
          last_message: row.message,
          message_type: row.message_type,
          timestamp: row.timestamp,
          unread_count: 0,
        });
      }
      if (row.receiver_id === userId && !row.is_read) {
        roomMap.get(row.room_id).unread_count += 1;
      }
    }

    // Fetch partner details (name, profile_pic, role) in one query
    if (partnerIds.size > 0) {
      const { data: partners } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("id, name, email, role, profile_pic")
        .in("id", [...partnerIds]);

      // Attach partner info to each room
      for (const room of roomMap.values()) {
        const partner = (partners || []).find((p) => p.id === room.partner_id);
        if (partner) {
          room.partner_name = partner.name;
          room.partner_email = partner.email;
          room.partner_role = partner.role;
          room.partner_profile_pic = partner.profile_pic;
        }
      }
    }

    const rooms = [...roomMap.values()].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    return res
      .status(200)
      .json({ success: true, data: rooms, total: rooms.length });
  } catch (err) {
    console.error("[Chat] getChatRooms exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
// =============================================================================
// @desc    Get total unread message count for the logged-in user
// @route   GET /api/chat/unread-count
// @access  Private
// =============================================================================
export const getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from(TABLES.CHAT_MESSAGES)
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", req.user.id)
      .eq("is_read", false);

    if (error) {
      console.error("[Chat] getUnreadCount DB error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch unread count." });
    }

    return res
      .status(200)
      .json({ success: true, data: { unread: count ?? 0 } });
  } catch (err) {
    console.error("[Chat] getUnreadCount exception:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
