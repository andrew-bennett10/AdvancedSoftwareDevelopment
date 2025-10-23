import React from "react";
import "./BulkActionBar.css";

export default function BulkActionBar({
  count,
  onRemove,
  onClear,
  removeDisabled = false,
  clearDisabled = false,
}) {
  if (!count || count <= 0) return null;

  return (
    <div className="bulk-action-bar">
      <span className="bulk-action-bar__count">
        {count} selected
      </span>
      <div className="bulk-action-bar__actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClear}
          disabled={clearDisabled}
        >
          Clear Selection
        </button>
        <button
          type="button"
          className="btn btn-red"
          onClick={onRemove}
          disabled={removeDisabled}
        >
          Remove Selected
        </button>
      </div>
    </div>
  );
}
