import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiFileText,
  FiCalendar,
  FiLink,
  FiUpload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiSave,
  FiLoader,
  FiTrash2,
  FiEye,
  FiImage,
  FiTag,
  FiPlus,
  FiChevronDown,
  FiGlobe,
  FiHash,
} from "react-icons/fi";
import { HiSparkles, HiTrophy, HiAcademicCap } from "react-icons/hi2";
import { supabase } from "../../utils/supabaseClient";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ACHIEVEMENT_TYPES = [
  {
    value: "Award",
    label: "Award",
    icon: HiTrophy,
    gradient: "from-amber-500 to-orange-400",
    bg: "bg-amber-500/12",
    text: "text-amber-400",
    border: "border-amber-500/25",
  },
  {
    value: "Patent",
    label: "Patent",
    icon: FiFileText,
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/12",
    text: "text-blue-400",
    border: "border-blue-500/25",
  },
  {
    value: "Fellowship",
    label: "Fellowship",
    icon: HiAcademicCap,
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-500/12",
    text: "text-violet-400",
    border: "border-violet-500/25",
  },
  {
    value: "Grant",
    label: "Grant",
    icon: FiAward,
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-500/12",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  {
    value: "Certification",
    label: "Certification",
    icon: FiCheck,
    gradient: "from-sky-500 to-blue-400",
    bg: "bg-sky-500/12",
    text: "text-sky-400",
    border: "border-sky-500/25",
  },
  {
    value: "Recognition",
    label: "Recognition",
    icon: HiSparkles,
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/12",
    text: "text-pink-400",
    border: "border-pink-500/25",
  },
  {
    value: "Other",
    label: "Other",
    icon: FiTag,
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/12",
    text: "text-slate-400",
    border: "border-slate-500/25",
  },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active", dot: "bg-emerald-400" },
  { value: "Pending", label: "Pending", dot: "bg-amber-400" },
  { value: "Expired", label: "Expired", dot: "bg-slate-500" },
  { value: "Granted", label: "Granted", dot: "bg-blue-400" },
];

const YEARS = Array.from({ length: 30 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_PDF = { "application/pdf": [".pdf"] };
const ACCEPTED_IMAGE = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

// ─────────────────────────────────────────────
// INITIAL FORM STATE
// ─────────────────────────────────────────────
const INITIAL_STATE = {
  title: "",
  type: "",
  organization: "",
  year: "",
  description: "",
  status: "Active",
  url: "",
  patentNumber: "",
  amount: "",
  tags: [],
};

// ─────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────
function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.type) errors.type = "Please select a type.";
  if (!form.organization.trim())
    errors.organization = "Issuing organization is required.";
  if (!form.year) errors.year = "Year is required.";
  if (form.description.trim().length > 0 && form.description.trim().length < 20)
    errors.description = "Description must be at least 20 characters.";
  if (form.url && !/^https?:\/\/.+/.test(form.url))
    errors.url = "Must be a valid URL starting with http(s)://";
  return errors;
}

// ─────────────────────────────────────────────
// HELPER — format bytes
// ─────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────
function FieldWrapper({ label, required, error, hint, children, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5"
    >
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {Icon && <Icon size={11} className="text-slate-600" />}
        {label}
        {required && (
          <span className="text-blue-500 text-sm leading-none">*</span>
        )}
      </label>
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-red-400 font-medium"
          >
            <FiAlertCircle size={11} />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" className="text-[11px] text-slate-600">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// STYLED INPUT
// ─────────────────────────────────────────────
function StyledInput({ error, className = "", ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      animate={{
        boxShadow: focused
          ? error
            ? "0 0 0 2px rgba(239,68,68,0.4)"
            : "0 0 0 2px rgba(59,130,246,0.4)"
          : "0 0 0 0px transparent",
      }}
      transition={{ duration: 0.2 }}
      className="rounded-xl"
    >
      <input
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-sm text-white placeholder-slate-600
          focus:outline-none transition-colors duration-200
          ${
            error
              ? "border-red-500/40 bg-red-500/5"
              : focused
                ? "border-blue-500/50 bg-slate-800"
                : "border-white/8 hover:border-white/15"
          } ${className}`}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// STYLED TEXTAREA
// ─────────────────────────────────────────────
function StyledTextarea({ error, maxLength, value, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{
          boxShadow: focused
            ? error
              ? "0 0 0 2px rgba(239,68,68,0.4)"
              : "0 0 0 2px rgba(59,130,246,0.4)"
            : "0 0 0 0px transparent",
        }}
        transition={{ duration: 0.2 }}
        className="rounded-xl"
      >
        <textarea
          {...props}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-sm text-white placeholder-slate-600
            focus:outline-none transition-colors duration-200 resize-none
            ${
              error
                ? "border-red-500/40 bg-red-500/5"
                : focused
                  ? "border-blue-500/50 bg-slate-800"
                  : "border-white/8 hover:border-white/15"
            }`}
        />
      </motion.div>
      {maxLength && (
        <span
          className={`absolute bottom-2.5 right-3 text-[10px] font-medium
          ${value.length > maxLength * 0.9 ? "text-amber-400" : "text-slate-600"}`}
        >
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// STYLED SELECT
// ─────────────────────────────────────────────
function StyledSelect({ error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 2px rgba(59,130,246,0.4)"
            : "0 0 0 0px transparent",
        }}
        transition={{ duration: 0.2 }}
        className="rounded-xl"
      >
        <select
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-sm text-white
            focus:outline-none transition-colors duration-200 appearance-none cursor-pointer
            ${
              error
                ? "border-red-500/40 bg-red-500/5"
                : focused
                  ? "border-blue-500/50 bg-slate-800"
                  : "border-white/8 hover:border-white/15"
            }`}
        >
          {children}
        </select>
      </motion.div>
      <FiChevronDown
        size={14}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// TYPE SELECTOR — visual card grid
// ─────────────────────────────────────────────
function TypeSelector({ value, onChange, error }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ACHIEVEMENT_TYPES.map((t) => {
          const Icon = t.icon;
          const selected = value === t.value;
          return (
            <motion.button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold
                transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${
                  selected
                    ? `${t.bg} ${t.text} ${t.border} shadow-lg`
                    : "bg-slate-800/60 border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15"
                }`}
            >
              {selected && (
                <motion.div
                  layoutId="type-selected"
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${t.gradient} opacity-10`}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <Icon
                size={18}
                className={selected ? t.text : "text-slate-600"}
              />
              <span className="relative z-10 leading-none">{t.label}</span>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center"
                >
                  <FiCheck size={8} className="text-slate-900" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1.5"
        >
          <FiAlertCircle size={11} /> {error}
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAG INPUT
// ─────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const cleaned = input.trim().replace(/^#/, "");
    if (cleaned && !tags.includes(cleaned) && tags.length < 10) {
      onChange([...tags, cleaned]);
      setInput("");
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <StyledInput
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
              if (e.key === "Backspace" && !input && tags.length > 0)
                removeTag(tags[tags.length - 1]);
            }}
            placeholder="Add tag (press Enter or comma)"
            maxLength={30}
          />
        </div>
        <motion.button
          type="button"
          onClick={addTag}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!input.trim() || tags.length >= 10}
          className="px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400
            hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <FiPlus size={16} />
        </motion.button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                bg-blue-500/12 border border-blue-500/25 text-blue-400 text-xs font-semibold"
            >
              <FiHash size={10} />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-400 transition-colors focus:outline-none"
                aria-label={`Remove tag ${tag}`}
              >
                <FiX size={11} />
              </button>
            </motion.span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-600">{tags.length}/10 tags</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// FILE DROP ZONE
// ─────────────────────────────────────────────
function FileDropZone({
  label,
  accept,
  file,
  onFile,
  onRemove,
  icon: Icon,
  hint,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);

  const validateAndSet = (f) => {
    const acceptedTypes = Object.keys(accept).flatMap((k) => [k]);
    if (
      !acceptedTypes.some(
        (t) =>
          f.type === t ||
          (t.includes("*") && f.type.startsWith(t.split("/")[0])),
      )
    ) {
      alert(
        `Invalid file type. Accepted: ${Object.values(accept).flat().join(", ")}`,
      );
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max size: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    onFile(f);
  };

  return (
    <div className="flex flex-col gap-2">
      {file ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/25"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex-shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {file.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatBytes(file.size)}
            </p>
          </div>
          <motion.button
            type="button"
            onClick={onRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400
              hover:bg-red-500/20 transition-colors"
            aria-label="Remove file"
          >
            <FiTrash2 size={13} />
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          animate={{
            borderColor: dragging
              ? "rgba(59,130,246,0.6)"
              : "rgba(255,255,255,0.08)",
            backgroundColor: dragging
              ? "rgba(59,130,246,0.06)"
              : "rgba(15,23,42,0.3)",
            scale: dragging ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer
            hover:border-blue-500/40 hover:bg-blue-500/4 transition-colors duration-200 group"
        >
          <motion.div
            animate={{ y: dragging ? -4 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center w-11 h-11 rounded-xl
              bg-slate-800 border border-white/8 text-slate-500 group-hover:text-blue-400
              group-hover:border-blue-500/30 group-hover:bg-blue-500/8 transition-all duration-200"
          >
            <FiUpload size={18} />
          </motion.div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
              {dragging
                ? "Drop it here!"
                : `Drop ${label} here or click to browse`}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">{hint}</p>
          </div>
        </motion.div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={Object.values(accept).flat().join(",")}
        onChange={(e) =>
          e.target.files?.[0] && validateAndSet(e.target.files[0])
        }
        className="hidden"
        aria-label={`Upload ${label}`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM SECTION WRAPPER
// ─────────────────────────────────────────────
function FormSection({
  title,
  subtitle,
  icon: Icon,
  gradient,
  children,
  index = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: "easeOut" }}
      className="relative rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
    >
      {/* Section accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${gradient}`}
      />

      {/* Section header */}
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-white/6">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20 flex-shrink-0`}
        >
          <Icon size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Section body */}
      <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const config = {
    success: {
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: FiCheck,
    },
    error: {
      bg: "bg-red-500/15",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: FiAlertCircle,
    },
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border
            backdrop-blur-xl shadow-2xl max-w-sm
            ${config[toast.type]?.bg} ${config[toast.type]?.border}`}
        >
          {(() => {
            const Icon = config[toast.type]?.icon;
            return Icon ? (
              <Icon size={16} className={config[toast.type]?.text} />
            ) : null;
          })()}
          <p className={`text-sm font-semibold ${config[toast.type]?.text}`}>
            {toast.message}
          </p>
          <button
            onClick={onClose}
            className="ml-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <FiX size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// MAIN ACHIEVEMENT FORM COMPONENT
// ─────────────────────────────────────────────
/**
 * AchievementForm Props:
 * @param {object|null} initialData  — Pass existing achievement data for edit mode (null = create mode)
 * @param {function}    onSuccess    — Called after successful create/update with the saved record
 * @param {function}    onCancel     — Called when user cancels the form
 */
export default function AchievementForm({
  initialData = null,
  onSuccess,
  onCancel,
}) {
  const isEditMode = Boolean(initialData?.id);

  const [form, setForm] = useState({ ...INITIAL_STATE, ...initialData });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(
    initialData?.pdf_url || null,
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialData?.image_url || null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ pdf: 0, image: 0 });
  const [toast, setToast] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Mark dirty on any change
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setIsDirty(true);
    // Live validate touched fields
    const newErrors = validate({ ...form, [field]: value });
    setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(form);
    setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
  };

  // ── UPLOAD FILE TO SUPABASE STORAGE ──
  const uploadFile = async (file, bucket, folder) => {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };

  // ── SUBMIT HANDLER ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const allErrors = validate(form);
    setErrors(allErrors);
    setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));
    if (Object.keys(allErrors).length > 0) {
      setToast({
        type: "error",
        message: "Please fix the highlighted errors before submitting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      let pdfUrl = pdfPreviewUrl || initialData?.pdf_url || null;
      let imageUrl = imagePreviewUrl || initialData?.image_url || null;

      // Upload PDF
      if (pdfFile) {
        setUploadProgress((p) => ({ ...p, pdf: 30 }));
        pdfUrl = await uploadFile(pdfFile, "achievements", "pdfs");
        setUploadProgress((p) => ({ ...p, pdf: 100 }));
      }

      // Upload image
      if (imageFile) {
        setUploadProgress((p) => ({ ...p, image: 30 }));
        imageUrl = await uploadFile(imageFile, "achievements", "images");
        setUploadProgress((p) => ({ ...p, image: 100 }));
      }

      const payload = {
        title: form.title.trim(),
        type: form.type,
        organization: form.organization.trim(),
        year: form.year,
        description: form.description.trim(),
        status: form.status,
        url: form.url.trim() || null,
        patent_number: form.patentNumber.trim() || null,
        amount: form.amount.trim() || null,
        tags: form.tags,
        pdf_url: pdfUrl,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (isEditMode) {
        const { data, error } = await supabase
          .from("achievements")
          .update(payload)
          .eq("id", initialData.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("achievements")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      setToast({
        type: "success",
        message: isEditMode
          ? "Achievement updated successfully!"
          : "Achievement created successfully!",
      });
      setIsDirty(false);
      setTimeout(() => onSuccess?.(result), 1200);
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
      setUploadProgress({ pdf: 0, image: 0 });
    }
  };

  // ── RESET ──
  const handleReset = () => {
    setForm({ ...INITIAL_STATE });
    setErrors({});
    setTouched({});
    setPdfFile(null);
    setImageFile(null);
    setPdfPreviewUrl(null);
    setImagePreviewUrl(null);
    setIsDirty(false);
  };

  const selectedType = ACHIEVEMENT_TYPES.find((t) => t.value === form.type);
  const isPatent = form.type === "Patent";
  const isGrant = form.type === "Grant";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-6 max-w-3xl mx-auto"
      >
        {/* ── FORM HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl
              bg-gradient-to-br ${selectedType?.gradient || "from-blue-500 to-cyan-400"} shadow-lg`}
            >
              {selectedType ? (
                <selectedType.icon size={18} className="text-white" />
              ) : (
                <FiAward size={18} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                {isEditMode ? "Edit Achievement" : "Add Achievement"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Editing: ${initialData?.title}`
                  : "Fill in the details below"}
              </p>
            </div>
          </div>

          {/* Dirty indicator */}
          <AnimatePresence>
            {isDirty && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/12
                  border border-amber-500/25 text-amber-400 text-[11px] font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Unsaved changes
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── SECTION 1: TYPE SELECTION ── */}
        <FormSection
          title="Achievement Type"
          subtitle="Select the category that best describes this achievement"
          icon={FiTag}
          gradient="from-blue-500 to-cyan-400"
          index={0}
        >
          <TypeSelector
            value={form.type}
            onChange={(val) => handleChange("type", val)}
            error={touched.type ? errors.type : undefined}
          />
        </FormSection>

        {/* ── SECTION 2: BASIC INFO ── */}
        <FormSection
          title="Basic Information"
          subtitle="Core details about the achievement"
          icon={FiAward}
          gradient="from-violet-500 to-purple-400"
          index={1}
        >
          <FieldWrapper
            label="Title"
            required
            icon={FiAward}
            error={touched.title ? errors.title : undefined}
          >
            <StyledInput
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="e.g. Best Paper Award at NeurIPS 2024"
              maxLength={200}
              error={touched.title ? errors.title : undefined}
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldWrapper
              label="Issuing Organization"
              required
              icon={FiGlobe}
              error={touched.organization ? errors.organization : undefined}
            >
              <StyledInput
                type="text"
                value={form.organization}
                onChange={(e) => handleChange("organization", e.target.value)}
                onBlur={() => handleBlur("organization")}
                placeholder="e.g. IEEE, ACM, Government of India"
                error={touched.organization ? errors.organization : undefined}
              />
            </FieldWrapper>

            <FieldWrapper
              label="Year"
              required
              icon={FiCalendar}
              error={touched.year ? errors.year : undefined}
            >
              <StyledSelect
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
                onBlur={() => handleBlur("year")}
                error={touched.year ? errors.year : undefined}
              >
                <option value="" className="bg-slate-900 text-slate-500">
                  Select year
                </option>
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-slate-900">
                    {y}
                  </option>
                ))}
              </StyledSelect>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldWrapper label="Status" icon={FiCheck}>
              <StyledSelect
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    className="bg-slate-900"
                  >
                    {s.label}
                  </option>
                ))}
              </StyledSelect>
            </FieldWrapper>

            {/* Patent number (only for Patent type) */}
            <AnimatePresence>
              {isPatent && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <FieldWrapper
                    label="Patent Number"
                    icon={FiHash}
                    hint="e.g. IN202141034567"
                  >
                    <StyledInput
                      type="text"
                      value={form.patentNumber}
                      onChange={(e) =>
                        handleChange("patentNumber", e.target.value)
                      }
                      placeholder="IN202141XXXXXX"
                    />
                  </FieldWrapper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grant amount (only for Grant type) */}
            <AnimatePresence>
              {isGrant && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <FieldWrapper
                    label="Grant Amount"
                    icon={FiHash}
                    hint="e.g. ₹25,00,000 or $50,000"
                  >
                    <StyledInput
                      type="text"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      placeholder="Enter amount with currency"
                    />
                  </FieldWrapper>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <FieldWrapper
            label="Description"
            icon={FiFileText}
            error={touched.description ? errors.description : undefined}
            hint="Optional — appears on the achievements page card"
          >
            <StyledTextarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              placeholder="Brief description of this achievement, its significance, or impact..."
              rows={4}
              maxLength={600}
              error={touched.description ? errors.description : undefined}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Reference URL"
            icon={FiLink}
            error={touched.url ? errors.url : undefined}
            hint="Optional — link to announcement, certificate, or article"
          >
            <StyledInput
              type="url"
              value={form.url}
              onChange={(e) => handleChange("url", e.target.value)}
              onBlur={() => handleBlur("url")}
              placeholder="https://example.com/award-announcement"
              error={touched.url ? errors.url : undefined}
            />
          </FieldWrapper>
        </FormSection>

        {/* ── SECTION 3: TAGS ── */}
        <FormSection
          title="Tags"
          subtitle="Add keywords to help filter and search achievements"
          icon={FiTag}
          gradient="from-emerald-500 to-teal-400"
          index={2}
        >
          <TagInput
            tags={form.tags}
            onChange={(tags) => handleChange("tags", tags)}
          />
        </FormSection>

        {/* ── SECTION 4: FILE UPLOADS ── */}
        <FormSection
          title="Attachments"
          subtitle="Upload certificate PDF and/or a cover image"
          icon={FiUpload}
          gradient="from-amber-500 to-orange-400"
          index={3}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* PDF Upload */}
            <FieldWrapper
              label="Certificate / Document"
              icon={FiFileText}
              hint="PDF · Max 10MB"
            >
              <FileDropZone
                label="PDF"
                accept={ACCEPTED_PDF}
                file={pdfFile}
                onFile={(f) => {
                  setPdfFile(f);
                  setPdfPreviewUrl(URL.createObjectURL(f));
                  setIsDirty(true);
                }}
                onRemove={() => {
                  setPdfFile(null);
                  setPdfPreviewUrl(null);
                  setIsDirty(true);
                }}
                icon={FiFileText}
                hint="PDF · Max 10MB"
              />
              {/* Existing PDF link */}
              {!pdfFile && initialData?.pdf_url && (
                <a
                  href={initialData.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  <FiEye size={12} /> View existing PDF
                </a>
              )}
              {/* Upload progress */}
              {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.pdf}%` }}
                  />
                </div>
              )}
            </FieldWrapper>

            {/* Image Upload */}
            <FieldWrapper
              label="Cover Image"
              icon={FiImage}
              hint="JPG, PNG, WebP · Max 10MB"
            >
              <FileDropZone
                label="image"
                accept={ACCEPTED_IMAGE}
                file={imageFile}
                onFile={(f) => {
                  setImageFile(f);
                  setImagePreviewUrl(URL.createObjectURL(f));
                  setIsDirty(true);
                }}
                onRemove={() => {
                  setImageFile(null);
                  setImagePreviewUrl(null);
                  setIsDirty(true);
                }}
                icon={FiImage}
                hint="JPG, PNG, WebP · Max 10MB"
              />
              {/* Image thumbnail preview */}
              {imagePreviewUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-28 object-cover rounded-xl border border-white/8 mt-1"
                />
              )}
              {/* Upload progress */}
              {uploadProgress.image > 0 && uploadProgress.image < 100 && (
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.image}%` }}
                  />
                </div>
              )}
            </FieldWrapper>
          </div>
        </FormSection>

        {/* ── ACTION BUTTONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
        >
          {/* Left: Reset */}
          <motion.button
            type="button"
            onClick={handleReset}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-slate-800 border border-white/10 text-slate-400
              hover:text-white hover:bg-slate-700 hover:border-white/20
              disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <FiTrash2 size={14} />
            Reset Form
          </motion.button>

          {/* Right: Cancel + Submit */}
          <div className="flex items-center gap-3">
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-slate-800 border border-white/10 text-slate-300
                  hover:text-white hover:bg-slate-700 hover:border-white/20
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <FiX size={14} />
                Cancel
              </motion.button>
            )}

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={submitting ? {} : { scale: 1.03 }}
              whileTap={submitting ? {} : { scale: 0.97 }}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
                bg-gradient-to-r from-blue-600 to-blue-500
                hover:from-blue-500 hover:to-emerald-500
                text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden"
            >
              {/* Shimmer on submitting */}
              {submitting && (
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
                  animate={{ x: ["-100%", "400%"] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={submitting ? "loading" : "idle"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <FiLoader size={14} />
                      </motion.span>
                      {isEditMode ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <FiSave size={14} />
                      {isEditMode ? "Update Achievement" : "Save Achievement"}
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* ── TOAST ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

// ─────────────────────────────────────────────
// USAGE EXAMPLE (delete in production)
// ─────────────────────────────────────────────
//
// CREATE MODE:
// <AchievementForm
//   onSuccess={(record) => console.log("Created:", record)}
//   onCancel={() => navigate("/admin/achievements")}
// />
//
// EDIT MODE:
// <AchievementForm
//   initialData={existingAchievement}
//   onSuccess={(record) => console.log("Updated:", record)}
//   onCancel={() => setEditOpen(false)}
// />
