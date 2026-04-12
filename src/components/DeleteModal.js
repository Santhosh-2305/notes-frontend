import React from "react";

const DeleteModal = ({ note, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-icon">🗑️</div>
      <h3>Delete Note?</h3>
      <p>
        Are you sure you want to delete{" "}
        <strong>"{note.title}"</strong>? This action cannot be undone.
      </p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default DeleteModal;
