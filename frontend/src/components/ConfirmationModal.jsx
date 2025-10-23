import React from "react";
import "./ConfirmationModal.css";

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal__backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        {title && <h3 className="confirm-modal__title">{title}</h3>}
        {message && <p className="confirm-modal__message">{message}</p>}

        <div className="confirm-modal__actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-red"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Removing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
