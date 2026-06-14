// src/components/chat/ChatWindow.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  X,
  Loader2,
  ChevronDown,
  ArrowLeft,
  MessageSquare,
  Shield,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { useSocket } from "../../contexts/SocketContext";
import {
  getMessagesApi,
  sendMessageApi,
  sendFileMessageApi,
  deleteMessageApi,
  markAsReadApi,
} from "../../api/chatApi";
import { useAuth } from "../../contexts/AuthContext";

const TYPING_TIMEOUT = 2000;

export default function ChatWindow({ partner, onBack }) {
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const containerRef = useRef(null);

  const fetchMessages = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    async (pg = 1, prepend = false) => {
      if (!partner?.id) return;
      try {
        const res = await getMessagesApi(partner.id, pg);
        if (res.success) {
          setMessages((prev) => (prepend ? [...res.data, ...prev] : res.data));
          setHasMore(res.pagination.hasNextPage);
          setPage(pg);
        }
      } catch (e) {
        console.error("[Chat] fetch error", e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [partner?.id],
  );

  useEffect(() => {
    if (!partner?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setMessages([]);
    setPage(1);
    fetchMessages(1);
    markAsReadApi(partner.id).catch(() => {});
    inputRef.current?.focus();
  }, [partner?.id, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    const onReceive = (msg) => {
      if (!partner?.id || msg.sender_id !== partner.id) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      markAsReadApi(partner.id).catch(() => {});
      // eslint-disable-next-line react-hooks/immutability
      scrollToBottom();
    };
    const onSent = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        const idx = prev.findIndex(
          (m) => m._optimistic && m.receiver_id === msg.receiver_id,
        );
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = msg;
          return next;
        }
        return [...prev, msg];
      });
      scrollToBottom();
    };
    const onTypingStart = ({ sender_id }) => {
      if (sender_id === partner?.id) setIsTyping(true);
    };
    const onTypingStop = ({ sender_id }) => {
      if (sender_id === partner?.id) setIsTyping(false);
    };
    const onRead = () =>
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));

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
  }, [socket, partner?.id]);

  const scrollToBottom = (smooth = true) =>
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });

  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading]);
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    if (el.scrollTop < 60 && hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchMessages(page + 1, true);
    }
  };

  const handleTyping = (val) => {
    setText(val);
    if (!socket || !user?.id) return;
    socket.emit("typing_start", {
      sender_id: user.id,
      receiver_id: partner.id,
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        sender_id: user.id,
        receiver_id: partner.id,
      });
    }, TYPING_TIMEOUT);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else setFilePreview(null);
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    socket?.emit("typing_stop", {
      sender_id: user.id,
      receiver_id: partner.id,
    });
    clearTimeout(typingTimerRef.current);
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
        if (socket?.connected) {
          socket.emit("send_message", {
            sender_id: user.id,
            receiver_id: partner.id,
            message: text.trim(),
            message_type: "text",
          });
        } else {
          const res = await sendMessageApi({
            receiver_id: partner.id,
            message: text.trim(),
          });
          if (res.success)
            setMessages((p) => p.map((m) => (m._optimistic ? res.data : m)));
        }
        setText("");
      }
    } catch (e) {
      console.error("[Chat] send error", e);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const online = isOnline(partner?.id);

  // ── Empty state ──
  if (!partner) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8"
        style={{ background: "#0D1424" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 0 40px rgba(99,102,241,0.08)",
            }}
          >
            <MessageSquare size={32} style={{ color: "#4f46e5" }} />
          </div>
          <p className="font-bold text-base mb-1" style={{ color: "#e2e8f0" }}>
            Select a conversation
          </p>
          <p className="text-sm" style={{ color: "#334155" }}>
            Choose someone from the sidebar to start chatting
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: "#0D1424" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{
          background: "#0B1120",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-150"
          style={{ background: "rgba(255,255,255,0.04)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
          }
        >
          <ArrowLeft size={15} style={{ color: "#64748b" }} />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden"
            style={{ boxShadow: "0 0 0 2px rgba(99,102,241,0.2)" }}
          >
            {partner.profile_pic ? (
              <img
                src={partner.profile_pic}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-sm font-black"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {partner.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 transition-colors duration-300"
            style={{
              background: online ? "#10b981" : "#334155",
              borderColor: "#0B1120",
              boxShadow: online ? "0 0 6px rgba(16,185,129,0.5)" : "none",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-bold truncate"
              style={{ color: "#e2e8f0" }}
            >
              {partner.name}
            </p>
            {partner.role === "admin" && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <Shield size={9} /> Admin
              </span>
            )}
          </div>
          <p
            className="text-[11px] flex items-center gap-1.5 mt-0.5"
            style={{ color: online ? "#10b981" : "#334155" }}
          >
            {online ? (
              <>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Online now
              </>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar"
        style={{ overscrollBehavior: "contain" }}
      >
        {loadingMore && (
          <div className="flex justify-center py-3">
            <Loader2
              size={15}
              style={{ color: "#4f46e5" }}
              className="animate-spin"
            />
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2
              size={24}
              style={{ color: "#4f46e5" }}
              className="animate-spin"
            />
            <p className="text-xs" style={{ color: "#334155" }}>
              Loading messages…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-3 text-center px-8"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <Send size={22} style={{ color: "#4f46e5" }} />
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "#e2e8f0" }}
              >
                No messages yet
              </p>
              <p className="text-xs" style={{ color: "#334155" }}>
                Say hello to {partner.name?.split(" ")[0]} 👋
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.sender_id === user?.id}
                onDelete={async (id) => {
                  try {
                    await deleteMessageApi(id);
                    setMessages((p) => p.filter((m) => m.id !== id));
                  } catch (e) {
                    console.error(e);
                  }
                }}
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
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-5 w-9 h-9 rounded-xl flex items-center justify-center z-10"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
            }}
          >
            <ChevronDown size={15} className="text-white" />
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
            className="px-4 py-3 flex items-center gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <Paperclip size={16} style={{ color: "#818cf8" }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "#e2e8f0" }}
              >
                {file.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "rgba(239,68,68,0.1)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.1)")
              }
            >
              <X size={12} style={{ color: "#f87171" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div
        className="px-4 py-3 flex items-end gap-2.5 flex-shrink-0"
        style={{
          background: "#0B1120",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Attach */}
        <label
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(99,102,241,0.12)";
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          }}
        >
          <Paperclip size={15} style={{ color: "#475569" }} />
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.zip,.txt"
            onChange={handleFileChange}
          />
        </label>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partner.name?.split(" ")[0]}…`}
            rows={1}
            className="w-full resize-none px-4 py-2.5 text-sm outline-none leading-relaxed rounded-xl transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#e2e8f0",
              maxHeight: "120px",
              overflowY: "auto",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(99,102,241,0.4)";
              e.target.style.background = "rgba(99,102,241,0.05)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.07)";
              e.target.style.background = "rgba(255,255,255,0.04)";
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
        </div>

        {/* Send */}
        <motion.button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background:
              text.trim() || file
                ? "linear-gradient(135deg, #4f46e5, #3b82f6)"
                : "rgba(255,255,255,0.05)",
            boxShadow:
              text.trim() || file ? "0 0 20px rgba(79,70,229,0.35)" : "none",
            border:
              text.trim() || file ? "none" : "1px solid rgba(255,255,255,0.07)",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? (
            <Loader2 size={15} className="text-white animate-spin" />
          ) : (
            <Send
              size={15}
              style={{
                color: text.trim() || file ? "white" : "#334155",
                transform: "rotate(0deg)",
              }}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
}
