import React from "react";

const Toast = ({ toasts, onClose }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type} ${t.removing ? "removing" : ""}`}>
          <div className="toast-dot" />
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => onClose(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
