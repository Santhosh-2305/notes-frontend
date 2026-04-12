import React, { useState, useEffect, useRef, useCallback } from "react";
import { defaultPrefs } from "../hooks/useNotePrefs";

const PRESET_TAGS = ["personal", "work", "study", "finance", "ideas", "health", "travel", "shopping"];

// Deterministic color slot from tag string (0-5)
export const TAG_COLOR = (tag) => {
  const palette = ["violet", "cyan", "amber", "rose", "emerald", "sky"];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const ACCENT_COLORS = [
  { id: "purple", hex: "#a78bfa" },
  { id: "yellow", hex: "#fbbf24" },
  { id: "red",    hex: "#f87171" },
  { id: "blue",   hex: "#38bdf8" },
  { id: "green",  hex: "#34d399" },
];

const FONT_SIZES = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
];

/* ── Rich-text toolbar commands ── */
const FORMAT_BTNS = [
  { cmd: "bold",      icon: <strong>B</strong>,  title: "Bold" },
  { cmd: "italic",    icon: <em>I</em>,           title: "Italic" },
  { cmd: "underline", icon: <u>U</u>,             title: "Underline" },
  { cmd: "insertUnorderedList", icon: "≡",        title: "Bullet list" },
];

const NoteForm = ({ onSubmit, editingNote, editingPrefs, onSavePrefs, onCancelEdit }) => {
  const [open, setOpen]               = useState(false);
  const [title, setTitle]             = useState("");
  const [error, setError]             = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [tagInput, setTagInput]       = useState("");

  // DB-persisted fields
  const [important, setImportant]     = useState(false);
  const [accentColor, setAccentColor] = useState("purple");
  const [tags, setTags]               = useState([]);

  // Client-only prefs
  const [prefs, setPrefs]             = useState(defaultPrefs());

  const titleRef   = useRef(null);
  const editorRef  = useRef(null);
  const fileRef    = useRef(null);

  /* ── Populate when editing ── */
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setImportant(!!editingNote.important);
      setAccentColor(editingNote.accentColor || "purple");
      setTags(editingNote.tags || []);
      setPrefs(editingPrefs || defaultPrefs());
      setOpen(true);
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = editingNote.body;
      }, 60);
    } else {
      setTitle("");
      setImportant(false);
      setAccentColor("purple");
      setTags([]);
      setPrefs(defaultPrefs());
      setOptionsOpen(false);
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
    setError("");
  }, [editingNote, editingPrefs]); // eslint-disable-line

  /* ── Auto-focus ── */
  useEffect(() => {
    if (open && titleRef.current) setTimeout(() => titleRef.current?.focus(), 50);
  }, [open]);

  const toggle = () => {
    if (open && !editingNote) {
      setOpen(false);
      setOptionsOpen(false);
      setTitle("");
      setImportant(false);
      setAccentColor("purple");
      setTags([]);
      setPrefs(defaultPrefs());
      setError("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    } else {
      setOpen(true);
    }
  };

  const patchPrefs = (patch) => {
    setPrefs((p) => ({ ...p, ...patch }));
    if (editingNote && onSavePrefs) onSavePrefs(patch);
  };

  /* ── Tag helpers ── */
  const addTag = useCallback((value) => {
    const raw = (value ?? tagInput).trim().toLowerCase().replace(/\s+/g, "-");
    if (raw && !tags.includes(raw)) setTags((prev) => [...prev, raw]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleTagBlur = () => {
    // Only commit if there's actual text — prevents empty tag on focus-out
    if (tagInput.trim()) addTag();
  };

  /* ── File attachments ── */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ name: file.name, type: file.type, dataUrl: reader.result });
            reader.readAsDataURL(file);
          })
      )
    ).then((added) => patchPrefs({ attachments: [...prefs.attachments, ...added] }));
    e.target.value = "";
  };

  const removeAttachment = (idx) =>
    patchPrefs({ attachments: prefs.attachments.filter((_, i) => i !== idx) });

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const bodyHtml = editorRef.current?.innerHTML?.trim() || "";
    const bodyText = editorRef.current?.innerText?.trim() || "";
    if (!title.trim() || !bodyText) {
      setError("Both title and content are required.");
      return;
    }
    setError("");
    onSubmit(
      { title: title.trim(), body: bodyHtml, important, accentColor, tags },
      prefs
    );
    setTitle("");
    setImportant(false);
    setAccentColor("purple");
    setTags([]);
    setPrefs(defaultPrefs());
    setOptionsOpen(false);
    setOpen(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleCancel = () => { onCancelEdit(); setOpen(false); setOptionsOpen(false); };

  const execFormat = (cmd) => { document.execCommand(cmd, false, null); editorRef.current?.focus(); };

  return (
    <div className={`glass form-card ${open ? "form-card--open" : ""}`}>
      {/* ── Header ── */}
      <div
        className="form-header form-header--clickable"
        onClick={toggle}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggle()}
      >
        <div className={`form-icon ${editingNote ? "form-icon--edit" : `form-icon--toggle ${open ? "form-icon--open" : ""}`}`}>
          {editingNote ? "✏️" : null}
        </div>
        <div className="form-header-text">
          <h2>{editingNote ? "Edit Note" : "Create New Note"}</h2>
          <p>{editingNote ? "Update your existing note" : open ? "Click to collapse" : "Capture your thoughts instantly"}</p>
        </div>
        <div className={`form-chevron ${open ? "form-chevron--open" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Collapsible body ── */}
      <div className={`form-body ${open ? "form-body--open" : ""}`}>
        <div className="form-body-inner">
          {error && <div className="form-error"><span>⚠️</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="field">
              <label>Title</label>
              <input
                ref={titleRef}
                type="text"
                placeholder="Give your note a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Rich-text content */}
            <div className="field">
              <label>Content</label>
              <div className="rte-wrapper">
                <div className="rte-toolbar" onMouseDown={(e) => e.preventDefault()}>
                  {FORMAT_BTNS.map(({ cmd, icon, title: t }) => (
                    <button
                      key={cmd}
                      type="button"
                      className="rte-btn"
                      title={t}
                      onClick={() => execFormat(cmd)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div
                  ref={editorRef}
                  className="rte-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Write your thoughts here..."
                  onInput={() => setError("")}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="field">
              <label>Tags</label>
              <div className="tags-input-wrap">
                {tags.map((t) => (
                  <span key={t} className={`tag-pill tag-pill--${TAG_COLOR(t)}`}>
                    #{t}
                    <button type="button" className="tag-pill-remove" onClick={() => removeTag(t)}>✕</button>
                  </span>
                ))}
                <input
                  className="tags-input"
                  type="text"
                  placeholder={tags.length ? "" : "Type a tag and press Enter…"}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleTagBlur}
                />
              </div>
              {/* Preset suggestions — show only tags not already added */}
              <div className="tag-suggestions">
                {PRESET_TAGS.filter((p) => !tags.includes(p)).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="tag-suggestion-chip"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur before click registers
                      if (!tags.includes(p)) setTags((prev) => [...prev, p]);
                    }}
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Options toggle ── */}
            <button
              type="button"
              className="options-toggle"
              onClick={() => setOptionsOpen((v) => !v)}
              aria-expanded={optionsOpen}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="13" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              <span>Options</span>
              <svg className={`options-chevron ${optionsOpen ? "options-chevron--open" : ""}`}
                width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* ── Options panel ── */}
            <div className={`options-panel ${optionsOpen ? "options-panel--open" : ""}`}>
              <div className="options-panel-inner">

                {/* Important */}
                <div className="opt-row">
                  <span className="opt-label">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"
                        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    </svg>
                    Mark as Important
                  </span>
                  <button
                    type="button"
                    className={`toggle-pill ${important ? "toggle-pill--on" : ""}`}
                    onClick={() => setImportant((v) => !v)}
                    aria-pressed={important}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                {/* Accent color — only when important */}
                {important && (
                  <div className="opt-row opt-row--indent">
                    <span className="opt-label">Accent Color</span>
                    <div className="color-swatches">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`swatch ${accentColor === c.id ? "swatch--active" : ""}`}
                          style={{ "--swatch-color": c.hex }}
                          title={c.id}
                          onClick={() => setAccentColor(c.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Font size */}
                <div className="opt-row">
                  <span className="opt-label">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 13L6 3l4 10M3.5 9.5h5M10 13V5.5M10 5.5C10 4 11 3 12.5 3S15 4 15 5.5 14 8 12.5 8 10 9 10 10.5s1 2.5 2.5 2.5S15 12 15 10.5"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Font Size
                  </span>
                  <div className="size-btns">
                    {FONT_SIZES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`size-btn ${prefs.fontSize === s.id ? "size-btn--active" : ""}`}
                        onClick={() => patchPrefs({ fontSize: s.id })}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                <div className="opt-row opt-row--col">
                  <div className="opt-row-top">
                    <span className="opt-label">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 8.5l-5.5 5.5a4 4 0 01-5.66-5.66l6-6a2.5 2.5 0 013.54 3.54l-6 6a1 1 0 01-1.42-1.42l5.5-5.5"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      Attachments
                    </span>
                    <button type="button" className="attach-btn" onClick={() => fileRef.current?.click()}>
                      + Add File
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </div>
                  {prefs.attachments.length > 0 && (
                    <div className="attach-list">
                      {prefs.attachments.map((a, i) => (
                        <AttachmentChip key={i} attachment={a} onRemove={() => removeAttachment(i)} />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="btn-row">
              {editingNote && (
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
              )}
              <button type="submit" className="btn btn-primary">
                <span>{editingNote ? "💾" : "+"}</span>
                {editingNote ? "Save Changes" : "Add Note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Attachment chip — shared with NoteList ── */
export const AttachmentChip = ({ attachment, onRemove, compact }) => {
  const isImage = attachment.type?.startsWith("image/");
  const ext = attachment.name.split(".").pop().toUpperCase();
  return (
    <div className={`attach-chip ${compact ? "attach-chip--compact" : ""}`}>
      {isImage
        ? <img src={attachment.dataUrl} alt={attachment.name} className="attach-thumb" />
        : <span className="attach-ext">{ext}</span>}
      <span className="attach-name">{attachment.name}</span>
      {onRemove && (
        <button type="button" className="attach-remove" onClick={onRemove} title="Remove">✕</button>
      )}
    </div>
  );
};

export default NoteForm;
