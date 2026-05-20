// src/layouts/MainLayout.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  ChevronDown,
  Loader2,
  Shield,
  Minimize2,
} from "lucide-react";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import PageTransition from "../components/common/PageTransition";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";

import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import {
  getMessagesApi,
  sendMessageApi,
  sendFileMessageApi,
  deleteMessageApi,
  markAsReadApi,
} from "../api/chatApi";

// ─────────────────────────────────────────────────────────────────────────────
// Helper — fetch the admin partner object from your user list / auth context.
// Adjust this import path / logic to match how your app exposes the admin ID.
// For now we read VITE_ADMIN_ID from env; swap in your real admin-fetching logic.
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_PARTNER = {
  id: import.meta.env.VITE_ADMIN_ID,
  name: "Admin Support",
  role: "admin",
  profile_pic: null,
};

const TYPING_TIMEOUT = 2000;

// ─────────────────────────────────────────────────────────────────────────────
// FloatingChat — self-contained mini chat panel
// ─────────────────────────────────────────────────────────────────────────────
function FloatingChat() {
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();

  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [unread, setUnread] = useState(0);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const containerRef = useRef(null);

  // ── partner is always admin for regular users ──────────────────────────
  const partner = ADMIN_PARTNER;
  const online = isOnline(partner.id);

  // ── fetch history when panel opens ────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!partner?.id) return;
    setLoading(true);
    try {
      const res = await getMessagesApi(partner.id, 1);
      if (res.success) {
        setMessages(res.data ?? []);
      }
    } catch (e) {
      console.error("[FloatingChat] fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [partner.id]);

  useEffect(() => {
    if (open && !minimised) {
      fetchMessages();
      markAsReadApi(partner.id).catch(() => {});
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, minimised, fetchMessages, partner.id]);

  // ── scroll helpers ─────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (!loading && open) scrollToBottom(false);
  }, [loading, open, scrollToBottom]);

  useEffect(() => {
    if (open && !minimised) scrollToBottom();
  }, [messages.length, open, minimised, scrollToBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 150);
  };

  // ── socket events ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      if (msg.sender_id !== partner.id) return;
      setMessages((p) => [...p, msg]);
      if (!open || minimised) setUnread((n) => n + 1);
      markAsReadApi(partner.id).catch(() => {});
    };

    const onSent = (msg) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._optimistic);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = msg;
          return next;
        }
        return [...prev, msg];
      });
    };

    const onTypingStart = ({ sender_id }) => {
      if (sender_id === partner.id) setIsTyping(true);
    };
    const onTypingStop = ({ sender_id }) => {
      if (sender_id === partner.id) setIsTyping(false);
    };
    const onRead = () => {
      setMessages((p) => p.map((m) => ({ ...m, is_read: true })));
    };

    socket.on("receive_message", onReceive);
    socket.on("message_sent", onSent);
    socket.on("typing_start", onTypingStart);
    socket.on("typing_stop", onTypingStop);
    socket.on("messages_read", onRead);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_sent", onSent);
      socket.off("typing_start", onTypingStart);
      socket.off("typing_stop", onTypingStop);
      socket.off("messages_read", onRead);
    };
  }, [socket, partner.id, open, minimised]);

  // ── typing ─────────────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    if (!socket || !user?.id) return;
    socket.emit("typing_start", {
      sender_id: user.id,
      receiver_id: partner.id,
    });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing_stop", {
        sender_id: user.id,
        receiver_id: partner.id,
      });
    }, TYPING_TIMEOUT);
  };

  // ── file ───────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };
  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  // ── send ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    socket?.emit("typing_stop", {
      sender_id: user.id,
      receiver_id: partner.id,
    });
    clearTimeout(typingTimer.current);

    try {
      if (file) {
        const type = file.type.startsWith("image/") ? "image" : "file";
        const res = await sendFileMessageApi({
          receiver_id: partner.id,
          file,
          message_type: type,
        });
        if (res.success) setMessages((p) => [...p, res.data]);
        clearFile();
      } else {
        const optimistic = {
          id: `opt_${Date.now()}`,
          _optimistic: true,
          sender_id: user.id,
          receiver_id: partner.id,
          message: text.trim(),
          message_type: "text",
          is_read: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((p) => [...p, optimistic]);
        setText("");

        if (socket?.connected) {
          socket.emit("send_message", {
            sender_id: user.id,
            receiver_id: partner.id,
            message: optimistic.message,
            message_type: "text",
          });
        } else {
          const res = await sendMessageApi({
            receiver_id: partner.id,
            message: optimistic.message,
          });
          if (res.success) {
            setMessages((p) => p.map((m) => (m._optimistic ? res.data : m)));
          }
        }
      }
    } catch (e) {
      console.error("[FloatingChat] send error", e);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteMessageApi(id);
      setMessages((p) => p.filter((m) => m.id !== id));
    } catch (e) {
      console.error("[FloatingChat] delete error", e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── toggle helpers ─────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
    setUnread(0);
  };
  const handleClose = () => {
    setOpen(false);
    setMinimised(false);
  };
  const handleMinimise = () => setMinimised((v) => !v);

  if (!ADMIN_PARTNER.id) {
    console.error("VITE_ADMIN_ID is not set in .env");
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed",
              bottom: "80px",
              right: "24px",
              width: "360px",
              zIndex: 9999,
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(99,102,241,0.18)",
              background: "var(--bg-primary, #0f1117)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* ── Panel Header ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={handleMinimise}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Shield size={16} color="#fff" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  Admin Support
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.72)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {online ? (
                    <>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#34d399",
                          display: "inline-block",
                        }}
                      />{" "}
                      Online
                    </>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinimise();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Minimize2 size={13} color="#fff" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={13} color="#fff" />
                </button>
              </div>
            </div>

            {/* ── Messages area (collapses when minimised) ── */}
            <AnimatePresence initial={false}>
              {!minimised && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 380, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Messages scroll area */}
                  <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "12px 12px 4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(99,102,241,0.25) transparent",
                    }}
                  >
                    {loading ? (
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 200,
                        }}
                      >
                        <Loader2
                          size={20}
                          className="animate-spin"
                          style={{ color: "#6366f1" }}
                        />
                      </div>
                    ) : messages.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          minHeight: 200,
                          textAlign: "center",
                          padding: "0 16px",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "rgba(99,102,241,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Send size={18} style={{ color: "#6366f1" }} />
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--text-muted, #64748b)",
                          }}
                        >
                          No messages yet. Say hello! 👋
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMine={msg.sender_id === user?.id}
                            onDelete={handleDelete}
                            partnerName={partner.name}
                            partnerPic={partner.profile_pic}
                          />
                        ))}
                      </AnimatePresence>
                    )}

                    <AnimatePresence>
                      {isTyping && <TypingIndicator name={partner.name} />}
                    </AnimatePresence>

                    <div ref={bottomRef} />
                  </div>

                  {/* Scroll-to-bottom button */}
                  <AnimatePresence>
                    {showScrollBtn && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => scrollToBottom()}
                        style={{
                          position: "absolute",
                          bottom: 72,
                          right: 16,
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "#4f46e5",
                          border: "none",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 2,
                          boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
                        }}
                      >
                        <ChevronDown size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* ── File preview ── */}
                  <AnimatePresence>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          padding: "8px 12px",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="preview"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: "rgba(99,102,241,0.12)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Paperclip size={14} style={{ color: "#6366f1" }} />
                          </div>
                        )}
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            color: "var(--text-primary, #e2e8f0)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </span>
                        <button
                          onClick={clearFile}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          <X size={13} style={{ color: "#64748b" }} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Input bar ── */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 8,
                      flexShrink: 0,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Attach */}
                    <label
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Paperclip size={14} style={{ color: "#64748b" }} />
                      <input
                        type="file"
                        style={{ display: "none" }}
                        accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                        onChange={handleFileChange}
                      />
                    </label>

                    {/* Textarea */}
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message…"
                      rows={1}
                      style={{
                        flex: 1,
                        resize: "none",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "7px 12px",
                        fontSize: 13,
                        color: "var(--text-primary, #e2e8f0)",
                        outline: "none",
                        lineHeight: 1.5,
                        maxHeight: 80,
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        fontFamily: "inherit",
                      }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height =
                          Math.min(e.target.scrollHeight, 80) + "px";
                      }}
                    />

                    {/* Send */}
                    <motion.button
                      onClick={handleSend}
                      disabled={(!text.trim() && !file) || sending}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        opacity: (!text.trim() && !file) || sending ? 0.4 : 1,
                        transition: "opacity 0.2s",
                        boxShadow: "0 4px 12px rgba(79,70,229,0.35)",
                      }}
                    >
                      {sending ? (
                        <Loader2
                          size={13}
                          color="#fff"
                          className="animate-spin"
                        />
                      ) : (
                        <Send size={13} color="#fff" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ── */}
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="open-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={handleOpen}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 9999,
              boxShadow:
                "0 8px 28px rgba(79,70,229,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <MessageCircle size={22} color="#fff" />

            {/* Unread badge */}
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    border: "2px solid var(--bg-primary, #0f1117)",
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Pulse ring */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(99,102,241,0.5)",
                animation: "chat-pulse 2s ease-out infinite",
              }}
            />
          </motion.button>
        ) : (
          /* Close button visible while panel is open */
          <motion.button
            key="close-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={handleClose}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 9999,
              boxShadow:
                "0 8px 28px rgba(79,70,229,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <X size={20} color="#fff" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes chat-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.5); opacity: 0;   }
          100% { transform: scale(1.5); opacity: 0;   }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MainLayout
// ─────────────────────────────────────────────────────────────────────────────
function MainLayout() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />

      {/* ── Floating chat — only for logged-in users ── */}
      {isAuthenticated && user?.role !== "admin" && <FloatingChat />}
    </div>
  );
}

export default MainLayout;
