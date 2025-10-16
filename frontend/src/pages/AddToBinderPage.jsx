/**
 * AddToBinderPage – browse catalog and stage cards for addition
 * Endpoints: GET /api/cards, GET/POST/PATCH /api/binders/:binderId/cards
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavigationBar from "../NavigationBar";
import CardGallery from "../components/CardGallary";
import CardModal from "../components/CardModal";
import {
  getBinderCards,
  updateCardQty,
} from "../lib/api/binders";
import { searchCards } from "../lib/api/cards";
import "./BinderPage.css";

const PAGE_SIZE = 20;
const TYPES = [
  "Colorless",
  "Darkness",
  "Dragon",
  "Electric",
  "Fairy",
  "Fighting",
  "Fire",
  "Grass",
  "Metal",
  "Psychic",
  "Water",
];
const RARITIES = ["Common", "Uncommon", "Rare", "Ultra Rare"];

function normalizeCatalogItem(row) {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    rarity: row.rarity,
    type: row.type,
    number: row.number,
    set_name: row.set_name,
    hp: row.hp,
    weaknesses: row.weaknesses,
    retreat: row.retreat,
  };
}

export default function AddToBinderPage() {
  const navigate = useNavigate();
  const { binderId: binderParam } = useParams();
  // Binder id pulled from the route, ensure it's a valid positive number.
  const binderId = useMemo(() => {
    const parsed = Number(binderParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [binderParam]);

  const [accountId, setAccountId] = useState(null);
  const [accountError, setAccountError] = useState(null);

  const [baseQuantities, setBaseQuantities] = useState({});
  const [staged, setStaged] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: "", rarity: "", set: "" });
  const [searchPage, setSearchPage] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchResults, setSearchResults] = useState([]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Combine base binder quantities with staged additions for display.
  const combinedQuantities = useMemo(() => {
    const map = { ...baseQuantities };
    Object.entries(staged).forEach(([cardId, entry]) => {
      map[cardId] = (map[cardId] || 0) + entry.qty;
    });
    return map;
  }, [baseQuantities, staged]);

  // Resolve logged-in account id from storage so we can guard API calls.
  useEffect(() => {
    const stored = Number(localStorage.getItem("accountId"));
    if (Number.isFinite(stored) && stored > 0) {
      setAccountId(stored);
      setAccountError(null);
      return;
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed?.id) {
          const resolved = Number(parsed.id);
          if (Number.isFinite(resolved) && resolved > 0) {
            localStorage.setItem("accountId", String(resolved));
            setAccountId(resolved);
            setAccountError(null);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to parse stored userData", err);
      }
    }
    setAccountError("Please log in again to add cards.");
  }, []);

  // Load current binder quantities once so staged changes reflect actual totals.
  useEffect(() => {
    if (!binderId || !accountId) return;
    getBinderCards(binderId)
      .then((rows) => {
        const qty = {};
        (rows || []).forEach((row) => {
          const id = row.card_id || row.id;
          qty[id] = row.qty;
        });
        setBaseQuantities(qty);
      })
      .catch((err) => console.error("Failed to load binder quantities", err));
  }, [binderId, accountId]);

  // Debounced search whenever filters change
  useEffect(() => {
    if (!binderId) return;
    const timer = setTimeout(() => {
      const params = {
        q: searchTerm,
        type: filters.type,
        rarity: filters.rarity,
        set: filters.set,
        limit: PAGE_SIZE,
        offset: searchPage * PAGE_SIZE,
      };
      setSearchLoading(true);
      searchCards(params)
        .then((payload) => {
          const items = (payload.items || []).map(normalizeCatalogItem);
          setSearchResults(items);
          setSearchTotal(payload.total || 0);
          setSearchError(null);
        })
        .catch((err) => {
          console.error("Card search failed", err);
          setSearchError(err.message || "Failed to search cards.");
          setSearchResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [binderId, searchTerm, filters, searchPage]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const stagedEntries = useMemo(
    () => Object.entries(staged).filter(([, entry]) => entry.qty > 0),
    [staged]
  );

  // Increment staged quantity for a catalog card.
  const handleStageIncrement = (card) => {
    if (!card) return;
    setStaged((prev) => {
      const current = prev[card.id] || { card, qty: 0 };
      return { ...prev, [card.id]: { card, qty: current.qty + 1 } };
    });
  };

  // Decrement staged quantity, removing entry when it drops to zero.
  const handleStageDecrement = (cardId) => {
    setStaged((prev) => {
      const current = prev[cardId];
      if (!current) return prev;
      const nextQty = Math.max(current.qty - 1, 0);
      if (nextQty === 0) {
        const clone = { ...prev };
        delete clone[cardId];
        return clone;
      }
      return { ...prev, [cardId]: { ...current, qty: nextQty } };
    });
  };

  // Persist staged quantities sequentially so failures surface clearly.
  const handleSave = async () => {
    if (stagedEntries.length === 0 || saving) return;
    if (!accountId) {
      setToast({ type: "error", message: "Please log in again." });
      return;
    }
    setSaving(true);
    try {
      // Always pull the latest binder state before applying staged changes
      const latestRows = await getBinderCards(binderId);
      const updatedBase = {};
      (latestRows || []).forEach((row) => {
        const id = row.card_id || row.id;
        updatedBase[id] = row.qty;
      });
      for (const [cardId, { qty }] of stagedEntries) {
        const desiredQty = (updatedBase[cardId] || 0) + qty;
        if (desiredQty <= 0) continue;
        // Use PATCH to set final quantity directly
        await updateCardQty(binderId, cardId, desiredQty);
        updatedBase[cardId] = desiredQty;
      }
      setBaseQuantities(updatedBase);
      setStaged({});
      setToast({ type: "success", message: "Binder updated." });
    } catch (err) {
      console.error("Save staged cards failed", err);
      setToast({ type: "error", message: err.message || "Failed to save binder." });
    } finally {
      setSaving(false);
    }
  };

  // Clear staged list without touching existing binder data.
  const handleClear = () => {
    if (saving) return;
    setStaged({});
  };

  const totalPages = Math.max(Math.ceil(searchTotal / PAGE_SIZE), 1);

  const renderCheckout = () => (
    <aside className="binder-checkout">
      <h2 className="binder-checkout-title">Pending Additions</h2>
      {stagedEntries.length === 0 ? (
        <p className="binder-checkout-empty">No pending additions yet.</p>
      ) : (
        <div className="binder-checkout-list">
          {stagedEntries.map(([cardId, { card, qty }]) => (
            <div key={cardId} className="binder-checkout-item">
              <div className="binder-checkout-info">
                <span className="name">{card.name}</span>
                {card.number && <span className="meta">{card.number}</span>}
                {card.rarity && <span className="badge">{card.rarity}</span>}
              </div>
              <div className="binder-checkout-actions">
                <button className="circle-btn xs minus" onClick={() => handleStageDecrement(cardId)} aria-label="Decrease staged quantity">−</button>
                <span className="qty-pill xs">{qty}</span>
                <button className="circle-btn xs plus" onClick={() => handleStageIncrement(card)} aria-label="Increase staged quantity">+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="binder-checkout-summary">
        <div>Total staged: {stagedEntries.reduce((total, [, entry]) => total + entry.qty, 0)}</div>
      </div>
      <div className="binder-checkout-actions">
        <button className="btn btn-dark" onClick={handleClear} disabled={stagedEntries.length === 0 || saving}>
          Clear
        </button>
        <button className="btn btn-blue" onClick={handleSave} disabled={stagedEntries.length === 0 || saving || !accountId}>
          {saving ? "Saving..." : "Save to Binder"}
        </button>
      </div>
    </aside>
  );

  if (!binderId) {
    return (
      <div>
        <NavigationBar activePage="binders" />
        <div className="container mt-5">
          <p>No binder selected. Head back to your binders list.</p>
          <button className="btn btn-primary" onClick={() => navigate('/binders')}>Back to Binders</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavigationBar activePage="binders" />
      <div className="binder-layout">
        <main className="binder-main">
          <div className="binder-header">
            <button className="btn btn-link" onClick={() => navigate(`/binder/${binderId}`)}>&larr; View Binder</button>
            <div>
              <h1 className="binder-title">Add Cards</h1>
              <div className="binder-format">Binder #{binderId}</div>
            </div>
          </div>

          {accountError && <p role="alert" style={{ color: '#c00' }}>{accountError}</p>}

          <section className="binder-section">
            <h2 className="binder-section-title">Catalog</h2>
            <form className="binder-search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search by name or number"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchPage(0);
                }}
              />
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, type: e.target.value }));
                  setSearchPage(0);
                }}
              >
                <option value="">All Types</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={filters.rarity}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, rarity: e.target.value }));
                  setSearchPage(0);
                }}
              >
                <option value="">All Rarities</option>
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Set name"
                value={filters.set}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, set: e.target.value }));
                  setSearchPage(0);
                }}
              />
              <button type="submit">Search</button>
            </form>

            {searchError && <p role="alert" style={{ color: '#c00' }}>{searchError}</p>}

            {searchLoading ? (
              <p>Searching cards…</p>
            ) : searchResults.length === 0 ? (
              <p>No matching cards yet. Try another search.</p>
            ) : (
              <CardGallery
                cards={searchResults}
                quantities={combinedQuantities}
                onAdd={(card) => handleStageIncrement(card)}
                onRemove={(cardId) => {
                  // only decrement staged qty; do nothing if nothing staged yet
                  const stagedQty = staged[cardId]?.qty || 0;
                  if (stagedQty === 0) return;
                  handleStageDecrement(cardId);
                }}
                onView={(cardId) => {
                  const card = searchResults.find((item) => item.id === cardId);
                  if (card) {
                    setSelectedCard({ ...card });
                  }
                }}
              />
            )}

            <div className="binder-search-pagination">
              <button
                type="button"
                className="btn btn-dark"
                disabled={searchPage === 0}
                onClick={() => setSearchPage((prev) => Math.max(prev - 1, 0))}
              >
                Previous
              </button>
              <span>Page {searchPage + 1} of {totalPages}</span>
              <button
                type="button"
                className="btn btn-dark"
                disabled={searchPage + 1 >= totalPages}
                onClick={() => setSearchPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </section>
        </main>

        {renderCheckout()}

        {selectedCard && (
          <CardModal
            card={{
              ...selectedCard,
              imageUrl: selectedCard.imageUrl,
            }}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </div>

      {toast && (
        <div className={`binder-toast binder-toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}
