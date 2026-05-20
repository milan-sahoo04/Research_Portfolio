// src/pages/admin/ManageChat.jsx
import { useState, useEffect, useCallback } from "react";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import {
  getChatRoomsApi,
  getChatUsersApi,
  getAdminsForChatApi,
} from "../../api/chatApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { MessageSquare } from "lucide-react";

export default function ManageChat() {
  const { user, isAdmin, loading: authLoading } = useAuth(); // ← use isAdmin + authLoading from context
  const { socket } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // ── Load rooms + users based on role ──────────────────
  const loadData = useCallback(async () => {
    try {
      console.log("[ManageChat] isAdmin:", isAdmin);
      console.log("[ManageChat] user:", user);

      const [roomsRes, usersRes] = await Promise.all([
        getChatRoomsApi(),
        isAdmin ? getChatUsersApi() : getAdminsForChatApi(),
      ]);

      console.log("[ManageChat] roomsRes:", roomsRes);
      console.log("[ManageChat] usersRes:", usersRes);
      console.log("[ManageChat] allUsers after set:", usersRes.data);

      if (roomsRes.success) setRooms(roomsRes.data);
      if (usersRes.success) setAllUsers(usersRes.data);
    } catch (e) {
      console.error("[ManageChat] load error", e);
    }
  }, [isAdmin]);

  // ── Wait for auth to finish loading before fetching ───
  // This was the root cause — loadData fired before user was
  // hydrated from localStorage, so isAdmin was always false
  useEffect(() => {
    if (authLoading) return; // ← wait until user is hydrated
    loadData();
  }, [authLoading, loadData]);

  // ── Refresh only rooms on new socket messages ─────────
  useEffect(() => {
    if (!socket) return;
    const refreshRooms = async () => {
      try {
        const res = await getChatRoomsApi();
        if (res.success) setRooms(res.data);
      } catch (e) {
        console.error("[ManageChat] room refresh error", e);
      }
    };
    socket.on("receive_message", refreshRooms);
    socket.on("message_sent", refreshRooms);
    return () => {
      socket.off("receive_message", refreshRooms);
      socket.off("message_sent", refreshRooms);
    };
  }, [socket]); // ── Refresh rooms on new socket messages ─────────
  useEffect(() => {
    if (!socket) return;

    const refreshRooms = async () => {
      try {
        const res = await getChatRoomsApi();
        if (res.success) setRooms(res.data);
      } catch (e) {
        console.error("[ManageChat] room refresh error", e);
      }
    };

    const onReceive = (msg) => {
      // Update sidebar room immediately without waiting for API
      setRooms((prev) => {
        const exists = prev.find((r) => r.partner_id === msg.sender_id);
        if (exists) {
          // Update existing room's last message + unread count
          return prev.map((r) =>
            r.partner_id === msg.sender_id
              ? {
                  ...r,
                  last_message: msg.message,
                  message_type: msg.message_type,
                  timestamp: msg.timestamp,
                  unread_count:
                    selectedPartner?.id === msg.sender_id // if chat is open, don't increment
                      ? r.unread_count
                      : (r.unread_count || 0) + 1,
                }
              : r,
          );
        }
        // New room — do a full refresh to get partner details
        refreshRooms();
        return prev;
      });
    };

    socket.on("receive_message", onReceive);
    socket.on("message_sent", refreshRooms);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_sent", refreshRooms);
    };
  }, [socket, selectedPartner?.id]);

  const handleSelect = (u) => {
    setSelectedPartner(u);
    setShowSidebar(false);
  };

  const handleBack = () => {
    setShowSidebar(true);
    setSelectedPartner(null);
  };

  // ── Don't render until auth is ready ──────────────────
  if (authLoading) return null;

  return (
    <div
      className="flex h-[calc(100vh-64px)]"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Sidebar ── */}
      <div
        className={`
          w-full md:w-72 lg:w-80 flex-shrink-0
          ${showSidebar ? "flex" : "hidden"} md:flex
        `}
      >
        <div className="w-full">
          <ChatSidebar
            rooms={rooms}
            allUsers={allUsers}
            activeId={selectedPartner?.id}
            onSelect={handleSelect}
            isAdmin={isAdmin}
            currentUserId={user?.id}
          />
        </div>
      </div>

      {/* ── Chat window ── */}
      <div
        className={`
          flex-1 flex flex-col
          ${!showSidebar || selectedPartner ? "flex" : "hidden"} md:flex
        `}
        style={{ borderLeft: "1px solid var(--border)" }}
      >
        {selectedPartner ? (
          <ChatWindow partner={selectedPartner} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare size={28} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-primary font-semibold">
                Select a conversation
              </p>
              <p className="text-muted text-sm mt-1">
                {isAdmin
                  ? "Choose a user from the sidebar to start chatting"
                  : "Chat with our admin team for support"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
