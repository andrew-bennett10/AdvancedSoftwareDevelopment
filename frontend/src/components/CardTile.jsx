import React from "react";

export default function CardTile({ card, qty = 0, onAdd, onRemove, onView }) {
  if (!card) return null;

  const imgSrc = card.image || card.imageUrl;   // <- works for both shapes
  const alt = card.name || "Card";
  const canEdit = typeof onAdd === 'function' && typeof onRemove === 'function';
  const cardId = card.id ?? card.card_id;

  return (
    <div className="card-tile">
      <div
        className={`card-frame ${qty > 0 ? "card-frame--selected" : ""}`}
        onClick={() => onView?.(cardId)}
      >
        <img className="card-img" src={imgSrc} alt={alt} />
      </div>

      <div className={`tile-actions ${canEdit ? '' : 'tile-actions--readOnly'}`}>
        {canEdit ? (
          <>
            <button className="circle-btn minus" onClick={() => onRemove(cardId)} aria-label="remove">−</button>
            <span className="qty-pill">{qty}</span>
            <button className="circle-btn plus" onClick={() => onAdd(card)} aria-label="add">+</button>
          </>
        ) : (
          <span className="qty-pill readOnly">Qty: {qty}</span>
        )}
      </div>
    </div>
  );
}
