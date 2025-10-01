import React, { useEffect, useMemo, useState } from "react";
import CardGallery from "../components/CardGallary";
import BinderSidebar from "../components/BinderSidebar";
import CardModal from "../components/CardModal";
import "./BinderPage.css";

import {
  getBinderCards,
  getBinderCard,
  addCard as apiAddCard,
  changeQty,
} from "../lib/api/binders";

const BINDER_ID = 1;

function normalizeCard(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url || row.imageUrl,
    type: row.type,
    hp: row.hp,
    weaknesses: row.weaknesses,
    dex: row.dex,
    releaseDate: row.release_date || row.releaseDate,
    rarity: row.rarity,
    attack: row.attack,
    set: row.set_name || row.set,
    number: row.number,
    qty: row.qty,
  };
}

export default function BinderPage() {
  const [cards, setCards] = useState([]);
  const [cardsState, setCardsState] = useState({ quantities: {} });
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState({});

  const binderQuantities = useMemo(() => cardsState.quantities, [cardsState]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getBinderCards(BINDER_ID)
      .then((data) => {
        if (!active) return;
        const mapped = data.map(normalizeCard).filter(Boolean);
        const quantities = {};
        mapped.forEach((card) => {
          quantities[card.id] = card.qty;
        });
        setCards(mapped);
        setCardsState({ quantities });
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load binder");
        setCards([]);
        setCardsState({ quantities: {} });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const applyCardUpdate = (row) => {
    const normalized = normalizeCard(row);
    if (!normalized) return;
    setCards((prev) => {
      const index = prev.findIndex((c) => c.id === normalized.id);
      if (index === -1) {
        return [...prev, normalized];
      }
      const copy = [...prev];
      copy[index] = { ...copy[index], ...normalized };
      return copy;
    });
    setCardsState((prev) => ({
      quantities: { ...prev.quantities, [normalized.id]: normalized.qty },
    }));
  };

  const removeLocalCard = (cardId) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    setCardsState((prev) => {
      const next = { ...prev.quantities };
      delete next[cardId];
      return { quantities: next };
    });
  };

  const performChange = async (cardId, delta) => {
    if (!cardId || pending[cardId]) {
      return;
    }

    setPending((prev) => ({ ...prev, [cardId]: true }));
    try {
      const data = await changeQty(BINDER_ID, cardId, delta);
      if (data) {
        applyCardUpdate(data);
      } else {
        removeLocalCard(cardId);
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to update card quantity");
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    }
  };

  const handleAdd = (card) => {
    if (!card || !card.id) return;
    performChange(card.id, 1);
  };

  const handleRemove = (cardId) => {
    performChange(cardId, -1);
  };

  const handleView = async (cardId) => {
    try {
      const data = await getBinderCard(BINDER_ID, cardId);
      const normalized = normalizeCard(data);
      if (normalized) {
        setSelectedCard(normalized);
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load card details");
    }
  };

  const handleAddNewCard = async (event) => {
    event.preventDefault();
    const trimmed = addInput.trim();
    if (!trimmed || adding) return;

    setAdding(true);
    try {
      const data = await apiAddCard(BINDER_ID, { cardId: trimmed });
      applyCardUpdate(data);
      setAddInput("");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to add card");
    } finally {
      setAdding(false);
    }
  };

  const handleSave = () => {
    console.log("Save Binder", cardsState);
  };

  return (
    <div className="binder-layout">
      <main className="binder-main">
        {/* 🆕 Top-left header */}
        <h1 className="binder-title">Your Binder</h1>

        <form className="binder-add-form" onSubmit={handleAddNewCard} style={{ marginBottom: 16 }}>
          <label htmlFor="add-card-input" className="sr-only">Add card by ID</label>
          <input
            id="add-card-input"
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            placeholder="Enter card ID"
            disabled={adding}
          />
          <button type="submit" disabled={adding || !addInput.trim()}>
            {adding ? "Adding..." : "Add Card"}
          </button>
        </form>

        {loading ? (
          <p>Loading binder...</p>
        ) : error ? (
          <p role="alert" style={{ color: "#c00" }}>{error}</p>
        ) : null}

        {!loading && (
          <CardGallery
            cards={cards}
            quantities={binderQuantities}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onView={handleView}
          />
        )}
      </main>

      <BinderSidebar
        cardsState={cardsState}
        allCards={cards}
        onSave={handleSave}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
