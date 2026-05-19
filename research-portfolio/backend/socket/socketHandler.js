// ─────────────────────────────────────────────────────────────────────────────
// backend/socket/socketHandler.js
// ─────────────────────────────────────────────────────────────────────────────

import { supabaseAdmin, TABLES } from "../config/supabaseClient.js";

// ─────────────────────────────────────────────
// In-memory store
// onlineUsers  : Map<userId, socketId>
// typingUsers  : Map<roomId, Set<userId>>
// ─────────────────────────────────────────────
const onlineUsers = new Map();
const typingUsers = new Map();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const buildRoomId = (a, b) => [a, b].sort().join("_");

const saveMessageToDB = async (
  sender_id,
  receiver_id,
  message,
  message_type = "text",
) => {
  const room_id = buildRoomId(sender_id, receiver_id);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from(TABLES.CHAT_MESSAGES)
    .insert([
      {
        sender_id,
        receiver_id,
        room_id,
        message,
        message_type,
        is_read: false,
        timestamp: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const markMessagesRead = async (room_id, receiver_id) => {
  await supabaseAdmin
    .from(TABLES.CHAT_MESSAGES)
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq("room_id", room_id)
    .eq("receiver_id", receiver_id)
    .eq("is_read", false);
};

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected → ${socket.id}`);

    // ── REGISTER ───────────────────────────────────────────────────────────
    // Frontend: socket.emit("register", userId)
    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);
      socket.userId = userId; // attach for cleanup on disconnect

      // Broadcast updated online list to everyone
      io.emit("online_users", [...onlineUsers.keys()]);

      console.log(`[Socket] Registered user: ${userId} → ${socket.id}`);
    });

    // ── SEND MESSAGE ───────────────────────────────────────────────────────
    // Frontend: socket.emit("send_message", { sender_id, receiver_id, message, message_type? })
    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, message, message_type = "text" } = data;

      if (!sender_id || !receiver_id || !message) {
        socket.emit("error", {
          message: "sender_id, receiver_id and message are required.",
        });
        return;
      }

      try {
        // Persist to DB
        const saved = await saveMessageToDB(
          sender_id,
          receiver_id,
          message,
          message_type,
        );

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", saved);
        }

        // Confirm delivery back to sender
        socket.emit("message_sent", saved);

        console.log(`[Socket] Message: ${sender_id} → ${receiver_id}`);
      } catch (err) {
        console.error("[Socket] send_message error:", err.message);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    // ── TYPING INDICATOR ──────────────────────────────────────────────────
    // Frontend: socket.emit("typing_start", { sender_id, receiver_id })
    socket.on("typing_start", ({ sender_id, receiver_id }) => {
      if (!sender_id || !receiver_id) return;

      const room_id = buildRoomId(sender_id, receiver_id);
      if (!typingUsers.has(room_id)) typingUsers.set(room_id, new Set());
      typingUsers.get(room_id).add(sender_id);

      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing_start", { sender_id, room_id });
      }
    });

    // Frontend: socket.emit("typing_stop", { sender_id, receiver_id })
    socket.on("typing_stop", ({ sender_id, receiver_id }) => {
      if (!sender_id || !receiver_id) return;

      const room_id = buildRoomId(sender_id, receiver_id);
      typingUsers.get(room_id)?.delete(sender_id);

      const receiverSocketId = onlineUsers.get(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing_stop", { sender_id, room_id });
      }
    });

    // ── MARK AS READ ──────────────────────────────────────────────────────
    // Frontend: socket.emit("mark_read", { sender_id, receiver_id })
    // Tells the server: "I (receiver_id) have read messages from sender_id"
    socket.on("mark_read", async ({ sender_id, receiver_id }) => {
      if (!sender_id || !receiver_id) return;

      try {
        const room_id = buildRoomId(sender_id, receiver_id);
        await markMessagesRead(room_id, receiver_id);

        // Notify the original sender their messages were seen
        const senderSocketId = onlineUsers.get(sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", {
            room_id,
            read_by: receiver_id,
          });
        }
      } catch (err) {
        console.error("[Socket] mark_read error:", err.message);
      }
    });

    // ── GET ONLINE STATUS ─────────────────────────────────────────────────
    // Frontend: socket.emit("get_online_users")
    socket.on("get_online_users", () => {
      socket.emit("online_users", [...onlineUsers.keys()]);
    });

    // ── CHECK IF SPECIFIC USER IS ONLINE ──────────────────────────────────
    // Frontend: socket.emit("is_online", { userId })
    socket.on("is_online", ({ userId }) => {
      socket.emit("online_status", {
        userId,
        online: onlineUsers.has(userId),
      });
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const userId = socket.userId;

      if (userId) {
        onlineUsers.delete(userId);

        // Clean up any typing states for this user
        for (const [room_id, users] of typingUsers.entries()) {
          users.delete(userId);
          if (users.size === 0) typingUsers.delete(room_id);
        }

        // Broadcast updated online list
        io.emit("online_users", [...onlineUsers.keys()]);

        console.log(`[Socket] Disconnected: ${userId} (${socket.id})`);
      } else {
        console.log(`[Socket] Disconnected: ${socket.id} (unregistered)`);
      }
    });
  });
};
