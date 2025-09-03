import React from "react";
import { totalCards } from "../lib/binderLogic";
import "./BinderSideBar.css";

export default function BinderSidebar({ cardsState, allCards, onSave, onAdd, onRemove }) {
  const total = totalCards(cardsState);
  const detailed = Object.entries(cardsState.quantities)
    .map(([id, qty]) => {
      const c = allCards.find(x => String(x.id) === String(id));
      return c ? { id: c.id, name: c.name, qty } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  // placeholder binder price (sum of qty * 0.00)

  return (
    <aside className="deck-sidebar">
      <div className="deck-meta">
        <div className="row">
          <div>
            <div className="label">Format</div>
            <div className="value">Standard</div>
          </div>
        </div>

        <div className="progress">
          <div className="progress-top">{total}/60 Cards</div>
          <div className="bar">
            <span style={{ width: `${Math.min(100, (total / 60) * 100)}%` }} />
          </div>
        </div>

        <div className="list-head">
          <span>Name</span>
          <span>Qty</span>
        </div>

        <div className="deck-list">
          {detailed.length === 0 ? (
            <div className="empty">No cards yet.</div>
          ) : detailed.map(({ id, name, qty }) => (
<div key={id} className="deck-line">
  <span className="name">{name}</span>
  <div className="qty-controls">
    <button className="circle-btn xs minus" onClick={() => onRemove(id)}>−</button>
    <span className="qty-pill xs">{qty}</span>
    <button
      className="circle-btn xs plus"
      onClick={() => onAdd(allCards.find(c => c.id === id))}
    >
      +
    </button>
  </div>
</div>

          ))}
        </div>
      </div>

      <div className="deck-actions">
        <button className="btn btn-blue" onClick={onSave}>Save Binder</button>
      </div>
    </aside>
  );
}
