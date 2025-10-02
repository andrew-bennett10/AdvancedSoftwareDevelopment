import React from "react";
import "./CardModal.css";

function CardModal({ card, onClose }) {
  if (!card) return null;

  return (
    <div className="cm-backdrop" onClick={onClose}>
      <div className="cm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Left: image */}
        <div className="cm-left">
          {card.imageUrl && card.imageUrl !== 'Image not available yet' ? (
            <img className="cm-image" src={card.imageUrl} alt={card.name} />
          ) : (
            <div className="cm-image cm-image--placeholder">
              {card.imageUrl || 'Image not available yet'}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="cm-right">
          <h2 className="cm-title">{card.name}</h2>

{/* Stats grid (6 cards) */}
<div className="cm-stats cm-stats--six">
  <div className="cm-statCard">
    <div className="cm-statLabel">Type</div>
    <div className="cm-badges">
      {(Array.isArray(card.type) ? card.type : [card.type].filter(Boolean)).map((t, i) => (
        <span className="cm-badge" key={i}>{t}</span>
      ))}
      {!card.type && <span className="cm-badge cm-badgeMuted">—</span>}
    </div>
  </div>

  <div className="cm-statCard">
    <div className="cm-statLabel">HP</div>
    <div className="cm-statValue">{card.hp ?? "—"}</div>
  </div>

  <div className="cm-statCard">
    <div className="cm-statLabel">Weakness</div>
    <div className="cm-badges">
      {(Array.isArray(card.weaknesses) ? card.weaknesses : [card.weaknesses].filter(Boolean)).map((w, i) => (
        <span className="cm-badge" key={i}>{w}</span>
      ))}
      {!card.weaknesses && <span className="cm-badge cm-badgeMuted">—</span>}
    </div>
  </div>

  <div className="cm-statCard">
    <div className="cm-statLabel">National Pokédex #</div>
    <div className="cm-statValue">{card.dex ?? "—"}</div>
  </div>

  <div className="cm-statCard">
    <div className="cm-statLabel">Release Date</div>
    <div className="cm-statValue">
      {card.releaseDate ? new Date(card.releaseDate).toLocaleDateString() : "—"}
    </div>
  </div>

  <div className="cm-statCard">
    <div className="cm-statLabel">Rarity</div>
    <div className="cm-statValue">{card.rarity || "—"}</div>
  </div>
</div>

{/* Attack card */}
<div className="cm-attackCard">
  <div className="cm-attackHeader">
    <div className="cm-attackTitle">{card.attack?.name || "Attack"}</div>
    <div className="cm-attackDamage">{card.attack?.damage ?? "—"}</div>
  </div>
  {card.attack?.text && <p className="cm-attackText">{card.attack.text}</p>}
  {card.attack?.cost && (
    <div className="cm-badges" style={{ marginTop: 8 }}>
      {(Array.isArray(card.attack.cost) ? card.attack.cost : [card.attack.cost]).filter(Boolean).map((c, i) => (
        <span className="cm-badge" key={i}>{c}</span>
      ))}
    </div>
  )}
</div>

          <button className="cm-closeBtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
