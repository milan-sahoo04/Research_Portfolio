// src/components/chat/MessageBubble.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Check,
  CheckCheck,
  MoreHorizontal,
  FileText,
} from "lucide-react";

export default function MessageBubble({
  msg,
  isMine,
  onDelete,
  partnerName,
  partnerPic,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef(null);

  const isText = msg.message_type === "text";
  const isImage = msg.message_type === "image";
  const isFile = msg.message_type === "file";
  const isOptimistic = msg._optimistic;

  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(msg.id);
    setShowMenu(false);
    setConfirmDelete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`flex items-end gap-2 px-4 py-0.5 group ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Partner avatar */}
      {!isMine && (
        <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden mb-1">
          {partnerPic ? (
            <img
              src={partnerPic}
              alt={partnerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-xs font-black"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {partnerName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[68%] ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        {/* Bubble */}
        <div className="relative" ref={menuRef}>
          <div
            className={`relative px-4 py-2.5 text-sm leading-relaxed select-text transition-opacity duration-200 ${
              isMine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
            }`}
            style={
              isMine
                ? {
                    background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                    color: "white",
                    opacity: isOptimistic ? 0.7 : 1,
                    boxShadow: "0 2px 16px rgba(79,70,229,0.25)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }
            }
            onContextMenu={(e) => {
              e.preventDefault();
              if (isMine) setShowMenu(true);
            }}
          >
            {isText && (
              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
            )}

            {isImage && (
              <img
                src={msg.message}
                alt="Image"
                className="rounded-xl max-w-[220px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(msg.message, "_blank")}
              />
            )}

            {isFile && (
              <a
                href={msg.message}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isMine
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(99,102,241,0.15)",
                  }}
                >
                  <FileText
                    size={14}
                    style={{ color: isMine ? "white" : "#818cf8" }}
                  />
                </div>
                <span
                  className="text-xs font-medium underline underline-offset-2"
                  style={{
                    color: isMine ? "rgba(255,255,255,0.9)" : "#818cf8",
                  }}
                >
                  Download file
                </span>
              </a>
            )}

            {/* 3-dot menu trigger */}
            {isMine && (
              <motion.button
                onClick={() => setShowMenu((s) => !s)}
                initial={{ opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <MoreHorizontal size={13} style={{ color: "#64748b" }} />
              </motion.button>
            )}
          </div>

          {/* Context menu */}
          <AnimatePresence>
            {showMenu && isMine && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 4 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 bottom-full mb-2 rounded-xl overflow-hidden z-50"
                style={{
                  background: "#0F172A",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                  minWidth: "152px",
                }}
              >
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors duration-150"
                  style={{ color: confirmDelete ? "#f87171" : "#ef4444" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Trash2 size={13} />
                  {confirmDelete ? "Confirm delete?" : "Delete message"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time + read receipt */}
        <div
          className={`flex items-center gap-1 px-1 ${
            isMine ? "flex-row-reverse" : ""
          }`}
        >
          <span className="text-[10px]" style={{ color: "#1e293b" }}>
            {time}
          </span>
          {isMine &&
            (isOptimistic ? (
              <Check size={11} style={{ color: "#1e293b" }} />
            ) : msg.is_read ? (
              <CheckCheck size={11} style={{ color: "#6366f1" }} />
            ) : (
              <Check size={11} style={{ color: "#334155" }} />
            ))}
        </div>
      </div>
    </motion.div>
  );
}
