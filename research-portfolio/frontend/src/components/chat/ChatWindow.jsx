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
  Shield,
} from "lucide-react";
import { AnimatePresence as AP } from "framer-motion";
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
  const messagesContainerRef = useRef(null);

  // ── Fetch messages ─────────────────────────────────────
  const fetchMessages = useCallback(
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
    setLoading(true);
    setMessages([]);
    setPage(1);
    fetchMessages(1);
    markAsReadApi(partner.id).catch(() => {});
    inputRef.current?.focus();
  }, [partner?.id, fetchMessages]);

  // ── Socket events ──────────────────────────────────────
  // ── Socket events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      // Only add to messages if this conversation is currently open
      if (!partner?.id || msg.sender_id !== partner.id) return;

      setMessages((prev) => {
        // Avoid duplicates (in case both REST and socket deliver)
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      markAsReadApi(partner.id).catch(() => {});
      scrollToBottom();
    };

    const onSent = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;

        // Replace optimistic message if present
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
      scrollToBottom(); // ← ADD: scroll when sent message is confirmed
    };

    const onTypingStart = ({ sender_id }) => {
      if (sender_id === partner?.id) setIsTyping(true);
    };
    const onTypingStop = ({ sender_id }) => {
      if (sender_id === partner?.id) setIsTyping(false);
    };
    const onRead = () => {
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
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
  }, [socket, partner?.id]);
  // ── Scroll helpers ─────────────────────────────────────
  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 200);

    // Load more on scroll to top
    if (el.scrollTop < 60 && hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchMessages(page + 1, true);
    }
  };

  // ── Typing indicator ───────────────────────────────────
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

  // ── File pick ──────────────────────────────────────────
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

  // ── Send ───────────────────────────────────────────────
  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);

    // Stop typing indicator
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
        // Optimistic
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

        // Via socket for real-time
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
          if (res.success) {
            setMessages((p) => p.map((m) => (m._optimistic ? res.data : m)));
          }
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

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteMessageApi(id);
      setMessages((p) => p.filter((m) => m.id !== id));
    } catch (e) {
      console.error("[Chat] delete error", e);
    }
  };

  const online = isOnline(partner?.id);

  // ── Keyboard ───────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!partner) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Shield size={28} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-primary font-semibold">Select a conversation</p>
          <p className="text-muted text-sm mt-1">
            Choose someone from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={16} className="text-muted" />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden">
            {partner.profile_pic ? (
              <img
                src={partner.profile_pic}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {partner.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          {online && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: "var(--bg-primary)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary truncate">
              {partner.name}
            </p>
            {partner.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold flex-shrink-0">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {online ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online
              </span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-2 custom-scrollbar"
        style={{ overscrollBehavior: "contain" }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="text-indigo-400 animate-spin" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Send size={20} className="text-indigo-400" />
            </div>
            <p className="text-sm text-muted">No messages yet. Say hello! 👋</p>
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

      {/* Scroll to bottom btn */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg z-10"
          >
            <ChevronDown size={16} />
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
            className="px-4 py-2 flex items-center gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Paperclip size={16} className="text-indigo-400" />
              </div>
            )}
            <span className="text-xs text-primary flex-1 truncate">
              {file.name}
            </span>
            <button
              onClick={clearFile}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={14} className="text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div
        className="px-4 py-3 flex items-end gap-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* File attach */}
        <label className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <Paperclip
            size={16}
            className="text-muted hover:text-indigo-400 transition-colors"
          />
          <input
            type="file"
            className="hidden"
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
          className="flex-1 resize-none bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-primary placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors leading-relaxed"
          style={{ maxHeight: "120px", overflowY: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />

        {/* Send */}
        <motion.button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity shadow-lg"
        >
          {sending ? (
            <Loader2 size={15} className="text-white animate-spin" />
          ) : (
            <Send size={15} className="text-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
