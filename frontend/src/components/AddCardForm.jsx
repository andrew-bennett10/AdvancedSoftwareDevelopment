import React, { useState } from "react";

function AddCardForm({ onAdd }) {
  const [cardName, setCardName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardName) return;
    const newCard = {
      id: Date.now().toString(),
      name: cardName,
      set: "Unknown Set",
      number: "N/A",
      rarity: "Common",
      imageUrl: "/img/placeholder.png",
    };
    onAdd(newCard);
    setCardName("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Card name..."
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
      />
      <button type="submit">Add to Binder</button>
    </form>
  );
}

export default AddCardForm;