import React from "react";

function CardList({ cards, onDelete, onView }) {
  if (!cards.length) return <p>No cards in binder yet.</p>;

  return (
    <ul>
      {cards.map((card) => (
        <li key={card.id}>
          <span>{card.name}</span>
          <button onClick={() => onView(card.id)}>View</button>
          <button onClick={() => onDelete(card.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

export default CardList;