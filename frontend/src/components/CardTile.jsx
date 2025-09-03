import React from "react";

export default function CardTile({ card, qty = 0, onAdd, onRemove, onView }) {
  if (!card) return null;

  const imgSrc = card.image || card.imageUrl;   // <- works for both shapes
  const alt = card.name || "Card";

  return (
    <div className="card-tile">
      <div
        className={`card-frame ${qty > 0 ? "card-frame--selected" : ""}`}
        onClick={() => onView?.(card.id)}
      >
        <img className="card-img" src={imgSrc} alt={alt} />
      </div>

      <div className="tile-actions">
        <button className="circle-btn minus" onClick={() => onRemove(card.id)} aria-label="remove">−</button>
        <span className="qty-pill">{qty}</span>
        <button className="circle-btn plus" onClick={() => onAdd(card)} aria-label="add">+</button>
      </div>
    </div>
  );
}
