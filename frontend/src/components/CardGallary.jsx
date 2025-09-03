import React from "react";
import CardTile from "./CardTile";
import "./CardGallary.css";

function CardGallery({ cards, quantities, onAdd, onRemove, onView }) {
  return (
    <div className="gallery-grid">
      {cards.map(card => (
        <CardTile
          key={card.id}
          card={card}
          qty={quantities[card.id] || 0}
          onAdd={onAdd}
          onRemove={onRemove}
          onView={onView}
        />
      ))}
    </div>
  );
}

export default CardGallery;