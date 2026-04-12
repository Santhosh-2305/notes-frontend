import React, { useState, useEffect, useCallback } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import DeleteModal from "./components/DeleteModal";
import Toast from "./components/Toast";
import { useNotePrefs } from "./hooks/useNotePrefs";
import { TAG_COLOR } from "./components/NoteForm";
import {
  fetchNotes, createNote, updateNote,
  deleteNote, toggleImportant,
} from "./services/api";
import "./App.css";

let toastId = 0;

const App = () => {
  const [notes, setNotes]               = useState([]);
  const [editingNote, setEditingNote]   = useState(null);
  const [search, setSearch]             = useState("");
  const [activeTag, setActiveTag]       = useState(null);   // tag filter
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts]             = useState([]);

  const { getPrefs, updatePrefs, removePrefs } = useNotePrefs();

  /* ── Toast ── */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  const addToast = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  /* ── Data ── */
  const loadNotes = useCallback(async () => {
    try {
      const { data } = await fetchNotes();
      setNotes(data);
    } catch {
      addToast("Failed to load notes.", "error");
    }
  }, [addToast]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  /* ── Submit (create / update) ── */
  const handleSubmit = async (noteData, prefs) => {
    try {
      if (editingNote) {
        await updateNote(editingNote._id, noteData);
        if (prefs) updatePrefs(editingNote._id, prefs);
        setEditingNote(null);
        addToast("Note updated successfully!", "success");
      } else {
        const { data } = await createNote(noteData);
        if (prefs) updatePrefs(data._id, prefs);
        addToast("Note created!", "success");
      }
      loadNotes();
    } catch {
      addToast("Failed to save note.", "error");
    }
  };

  /* ── Toggle important ── */
  const handleToggleImportant = async (id) => {
    try {
      const { data } = await toggleImportant(id);
      // Update in place first for instant feedback, then reload for correct sort
      setNotes((prev) => prev.map((n) => n._id === id ? data : n));
      loadNotes();
    } catch {
      addToast("Failed to update note.", "error");
    }
  };

  /* ── Delete ── */
  const confirmDelete = (note) => setDeleteTarget(note);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNote(deleteTarget._id);
      removePrefs(deleteTarget._id);
      setDeleteTarget(null);
      loadNotes();
      addToast("Note deleted.", "info");
    } catch {
      addToast("Failed to delete note.", "error");
    }
  };

  /* ── Derived data ── */
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))].sort();

  // Strip HTML for search matching
  const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      n.title.toLowerCase().includes(q) ||
      stripHtml(n.body).toLowerCase().includes(q);
    const matchTag = !activeTag || (n.tags || []).includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="app-wrapper">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <div className="brand-logo">📝</div>
            <div className="brand-text">
              <span className="brand-name">NoteVault</span>
              <span className="brand-tagline">Your personal knowledge base</span>
            </div>
          </div>
          <div className="navbar-right">
            <span className="note-count-badge">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>
        </div>
      </nav>

      <div className="app-container">
        {/* ── Page Header ── */}
        <header className="page-header">
          <h1 className="page-title">Capture Every Idea</h1>
          <p className="page-subtitle">Organize your thoughts, beautifully.</p>
        </header>

        {/* ── Note Form ── */}
        <NoteForm
          onSubmit={handleSubmit}
          editingNote={editingNote}
          editingPrefs={editingNote ? getPrefs(editingNote._id) : null}
          onSavePrefs={(patch) => editingNote && updatePrefs(editingNote._id, patch)}
          onCancelEdit={() => setEditingNote(null)}
        />

        {/* ── Search ── */}
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search notes by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* ── Tag filter bar ── */}
        {allTags.length > 0 && (
          <div className="tag-filter-bar">
            <button
              className={`tag-filter-chip ${!activeTag ? "tag-filter-chip--active" : ""}`}
              onClick={() => setActiveTag(null)}
            >
              All
              <span className="tag-filter-count">{notes.length}</span>
            </button>
            {allTags.map((tag) => {
              const count = notes.filter((n) => (n.tags || []).includes(tag)).length;
              return (
                <button
                  key={tag}
                  className={`tag-filter-chip tag-filter-chip--${TAG_COLOR(tag)} ${activeTag === tag ? "tag-filter-chip--active" : ""}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  #{tag}
                  <span className="tag-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Section label ── */}
        {notes.length > 0 && (
          <div className="section-label">
            <span>
              {activeTag
                ? `#${activeTag} · ${filteredNotes.length}`
                : search
                ? `${filteredNotes.length} result${filteredNotes.length !== 1 ? "s" : ""}`
                : "All Notes"}
            </span>
            <div className="section-line" />
          </div>
        )}

        <NoteList
          notes={filteredNotes}
          getPrefs={getPrefs}
          onToggleImportant={handleToggleImportant}
          onTagClick={(tag) => { setActiveTag(tag); window.scrollTo({ top: 400, behavior: "smooth" }); }}
          onEdit={(note) => {
            setEditingNote(note);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={confirmDelete}
        />
      </div>

      {deleteTarget && (
        <DeleteModal
          note={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
