// src/api/chatApi.js
import axios from "./axios";

// ── Send text message ─────────────────────────────────────
export const sendMessageApi = async ({
  receiver_id,
  message,
  message_type = "text",
}) => {
  const { data } = await axios.post("/chat/send", {
    receiver_id,
    message,
    message_type,
  });
  return data;
};

// ── Send image/file message ───────────────────────────────
export const sendFileMessageApi = async ({
  receiver_id,
  file,
  message_type,
}) => {
  const form = new FormData();
  form.append("receiver_id", receiver_id);
  form.append("message_type", message_type);
  form.append("attachment", file);
  const { data } = await axios.post("/chat/send", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Fetch paginated messages ──────────────────────────────
export const getMessagesApi = async (receiverId, page = 1, limit = 30) => {
  const { data } = await axios.get(`/chat/messages/${receiverId}`, {
    params: { page, limit },
  });
  return data;
};

// ── Mark room as read ─────────────────────────────────────
export const markAsReadApi = async (senderId) => {
  const { data } = await axios.patch(`/chat/read/${senderId}`);
  return data;
};

// ── Delete message ────────────────────────────────────────
export const deleteMessageApi = async (id) => {
  const { data } = await axios.delete(`/chat/messages/${id}`);
  return data;
};

// ── Get all chat rooms ────────────────────────────────────
export const getChatRoomsApi = async () => {
  const { data } = await axios.get("/chat/rooms");
  return data;
};

// ── Get unread count ──────────────────────────────────────
export const getUnreadCountApi = async () => {
  const { data } = await axios.get("/chat/unread-count");
  return data;
};

// ── Get all users (admin only — for admin chat sidebar) ───
export const getChatUsersApi = async () => {
  const { data } = await axios.get(
    "/users/admin?limit=500&sort=name&order=asc",
  );
  return data;
};

// ── Get admins (for regular users to start chat with admin) ──
export const getAdminsForChatApi = async () => {
  const { data } = await axios.get("/users/admins"); // non-admin route
  return data; // { success, data: [{ id, name, role, profile_pic }] }
};
