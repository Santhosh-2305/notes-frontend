import React from "react";
import { AttachmentChip, TAG_COLOR } from "./NoteForm";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ACCENT_HEX = {
  purple: "#a78bfa",
  yellow: "#fbbf24",
  red:    "#f87171",
  blue:   "#38bdf8",
  green:  "#34d399",
};

const FONT_SIZE_CLASS = { sm: "note-body--sm", md: "", lg: "note-body--lg" };

const NoteList = ({ notes, getPrefs, onToggleImportant, onEdit, onDelete, onTagClick }) => {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-illustration">🗒️</div>
        <h3>No notes found</h3>
        <p>Your notes will appear here. Start by creating one above — ideas are waiting to be captured.</p>
      </div>
    );
  }

  return (
    <div className="notes-grid">
      {notes.map((note, i) => {
        const p          = getPrefs(note._id);
        const isImportant = !!note.important;
        const accent     = note.accentColor || "purple";
        const accentHex  = ACCENT_HEX[accent] || ACCENT_HEX.purple;

        return (
          <div
            key={note._id}
            className={`glass note-card ${isImportant ? "note-card--important" : ""}`}
            style={{ animationDelay: `${i * 0.06}s`, "--card-accent": accentHex }}
          >
            {/* Accent bar */}
            {isImportant && <div className="card-accent-bar" />}

            {/* Top row */}
            <div className="card-top">
              <div
                className="card-dot"
                style={isImportant ? { background: accentHex, boxShadow: `0 0 8px ${accentHex}99` } : {}}
              />
              <h3 className="note-title">{note.title}</h3>
              <button
                className={`star-btn ${isImportant ? "star-btn--on" : ""}`}
                title={isImportant ? "Unmark important" : "Mark as important"}
                style={isImportant ? { color: accentHex } : {}}
                onClick={() => onToggleImportant(note._id)}
              >
                {isImportant ? "★" : "☆"}
              </button>
            </div>

            {/* Body — render HTML from rich-text editor */}
            <div
              className={`note-body ${FONT_SIZE_CLASS[p.fontSize] || ""}`}
              dangerouslySetInnerHTML={{ __html: note.body }}
            />

            {/* Tags */}
            {note.tags?.length > 0 && (
              <div className="card-tags">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className={`card-tag card-tag--${TAG_COLOR(t)}`}
                    title={`Filter by #${t}`}
                    onClick={() => onTagClick && onTagClick(t)}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Attachments */}
            {p.attachments?.length > 0 && (
              <div className="card-attachments">
                {p.attachments.map((a, idx) => (
                  <AttachmentChip key={idx} attachment={a} compact />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="card-footer">
              <span className="card-date">🗓 {fmt(note.createdAt)}</span>
              <div className="card-actions">
                <button className="icon-btn edit"   title="Edit"   onClick={() => onEdit(note)}>✏️</button>
                <button className="icon-btn delete" title="Delete" onClick={() => onDelete(note)}>🗑️</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NoteList;
