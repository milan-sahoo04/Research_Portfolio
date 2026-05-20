// src/components/chat/MessageBubble.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Check,
  CheckCheck,
  MoreHorizontal,
  FileText,
  Image,
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

  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Close menu on outside click
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
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-end gap-2 px-4 group ${isMine ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isMine && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden mb-1">
          {partnerPic ? (
            <img
              src={partnerPic}
              alt={partnerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {partnerName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}
      >
        {/* Bubble */}
        <div className="relative" ref={menuRef}>
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-pointer select-text
              ${
                isMine
                  ? "rounded-br-sm bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
                  : "rounded-bl-sm text-primary"
              }`}
            style={
              !isMine
                ? {
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }
                : {}
            }
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu(true);
            }}
          >
            {/* Message content */}
            {isText && (
              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
            )}

            {isImage && (
              <img
                src={msg.message}
                alt="Image"
                className="rounded-xl max-w-[220px] max-h-[220px] object-cover cursor-pointer"
                onClick={() => window.open(msg.message, "_blank")}
              />
            )}

            {isFile && (
              <a
                href={msg.message}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${isMine ? "text-white" : "text-indigo-400"}`}
              >
                <FileText size={16} />
                <span className="text-xs underline underline-offset-2">
                  Download file
                </span>
              </a>
            )}

            {/* 3-dot menu button — appears on hover */}
            {isMine && (
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10"
              >
                <MoreHorizontal size={14} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Context menu */}
          <AnimatePresence>
            {showMenu && isMine && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 bottom-full mb-2 rounded-xl overflow-hidden z-50 min-w-[140px]"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                  {confirmDelete ? "Confirm delete?" : "Delete"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time + read receipt */}
        <div
          className={`flex items-center gap-1 px-1 ${isMine ? "flex-row-reverse" : ""}`}
        >
          <span className="text-[10px] text-muted">{time}</span>
          {isMine &&
            (msg.is_read ? (
              <CheckCheck size={11} className="text-indigo-400" />
            ) : (
              <Check size={11} className="text-slate-500" />
            ))}
        </div>
      </div>
    </motion.div>
  );
}
