import React from "react";
import CardTile from "./CardTile";
import "./SelectableCardTile.css";

export default function SelectableCardTile({
  card,
  qty,
  checked,
  editMode,
  onToggle,
  onView,
  disabled = false,
}) {
  if (!card) return null;

  const handleToggle = (event) => {
    event.stopPropagation();
    if (disabled) return;
    onToggle?.(card, event.target.checked);
  };

  const handleTileActivate = () => {
    if (disabled) return;
    if (editMode) {
      onToggle?.(card, !checked);
    } else {
      const cardId = card.id ?? card.card_id;
      onView?.(cardId);
    }
  };

  return (
    <div
      className={`selectable-card ${editMode ? "selectable-card--editing" : ""} ${
        checked ? "selectable-card--selected" : ""
      } ${disabled ? "selectable-card--disabled" : ""}`}
    >
      {editMode && (
        <label
          className={`selectable-card__checkbox ${
            disabled ? "selectable-card__checkbox--disabled" : ""
          }`}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleToggle}
            aria-label={`Select ${card.name ?? "card"}`}
          />
          <span aria-hidden="true" className="selectable-card__checkbox-inner">
            {checked ? "✓" : ""}
          </span>
        </label>
      )}

      <CardTile
        card={card}
        qty={qty}
        onView={handleTileActivate}
      />
    </div>
  );
}
