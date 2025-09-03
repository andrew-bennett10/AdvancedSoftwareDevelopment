import React, { useState } from "react";
import CardGallery from "../components/CardGallary";
import BinderSidebar from "../components/BinderSidebar";
import CardModal from "../components/CardModal";
import { MOCK_BINDERCARDS } from "../mock/bindercards";
import "./BinderPage.css";

import { addCard, removeCard } from "../lib/binderLogic";

export default function BinderPage() {
  const [cards] = useState(MOCK_BINDERCARDS);
  const [cardsState, setCardsState] = useState({ quantities: {} });
  const [selectedCard, setSelectedCard] = useState(null);

  const handleAdd = (card) => setCardsState(prev => addCard(prev, card));
  const handleRemove = (cardId) => setCardsState(prev => removeCard(prev, cardId));

  const handleView = (cardId) => {
    const found = cards.find(c => c.id === cardId);
    setSelectedCard(found || null);
  };

  const handleSave = () => {
    console.log("Save Binder", cardsState);
  };

  return (
    <div className="binder-layout">
      <main className="binder-main">
        {/* 🆕 Top-left header */}
        <h1 className="binder-title">Your Binder</h1>

        <CardGallery
          cards={cards}
          quantities={cardsState.quantities}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onView={handleView}
        />
      </main>

      <BinderSidebar
        cardsState={cardsState}
        allCards={cards}
        onSave={handleSave}
      />

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
