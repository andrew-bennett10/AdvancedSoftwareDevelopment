

export function deleteCard(cards, cardId) {
  return cards.filter((c) => c.id !== cardId);
}

export function getCardById(cards, cardId) {
  return cards.find((c) => c.id === cardId) || null;
}

// lib/binderLogic.js
export function addCard(cardsState, card) {
  const qty = (cardsState.quantities[card.id] || 0) + 1;
  return {
    ...cardsState,
    quantities: { ...cardsState.quantities, [card.id]: qty }
  };
}

export function removeCard(cardsState, cardId) {
  const current = cardsState.quantities[cardId] || 0;
  if (current <= 0) return cardsState;
  const next = { ...cardsState.quantities, [cardId]: current - 1 };
  if (next[cardId] === 0) delete next[cardId];
  return { ...cardsState, quantities: next };
}

export function totalCards(cardsState) {
  return Object.values(cardsState.quantities).reduce((a, b) => a + b, 0);
}

export function selectedCardsDetailed(cardsState, allCards) {
  // [{card, qty}]
  return Object.entries(cardsState.quantities).map(([id, qty]) => ({
    card: allCards.find(c => String(c.id) === String(id)),
    qty
  })).filter(x => x.card);
}
