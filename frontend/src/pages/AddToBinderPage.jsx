/**
 * AddToBinderPage – browse catalog, stage cards, and save to binder using modern UI shell.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const combinedQuantities = useMemo(() => {
    const map = { ...baseQuantities };
    Object.entries(staged).forEach(([cardId, entry]) => {
      map[cardId] = (map[cardId] || 0) + entry.qty;
    });
    return map;
  }, [baseQuantities, staged]);

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

  useEffect(() => {
    if (!binderId) {
      setSearchResults([]);
      setSearchTotal(0);
      return undefined;
    }
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

  const handleStageIncrement = (card) => {
    if (!card) return;
    setStaged((prev) => {
      const current = prev[card.id] || { card, qty: 0 };
      return { ...prev, [card.id]: { card, qty: current.qty + 1 } };
    });
  };

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

  const handleSave = async () => {
    if (stagedEntries.length === 0 || saving) return;
    if (!accountId) {
      setToast({ type: "error", message: "Please log in again." });
      return;
    }
    setSaving(true);
    try {
      const latestRows = await getBinderCards(binderId);
      const updatedBase = {};
      (latestRows || []).forEach((row) => {
        const id = row.card_id || row.id;
        updatedBase[id] = row.qty;
      });
      for (const [cardId, { qty }] of stagedEntries) {
        const desiredQty = (updatedBase[cardId] || 0) + qty;
        if (desiredQty <= 0) continue;
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

  const handleClear = () => {
    if (saving) return;
    setStaged({});
  };

  const totalPages = Math.max(Math.ceil(searchTotal / PAGE_SIZE), 1);

  const catalogContent = () => {
    if (!binderId) {
      return (
        <div className="binder-empty">
          <p>No binder selected. Head back to your binders list.</p>
          <button className="btn btn-blue" onClick={() => navigate("/binders")}>
            Back to Binders
          </button>
        </div>
      );
    }

    if (searchLoading) {
      return (
        <div className="binder-empty binder-empty--loading">
          <p>Searching cards…</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="binder-empty">
          <p>No matching cards yet. Try another search.</p>
        </div>
      );
    }

    return (
      <CardGallery
        cards={searchResults}
        quantities={combinedQuantities}
        onAdd={(card) => handleStageIncrement(card)}
        onRemove={(cardId) => {
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
    );
  };

  const navTabs = useMemo(
    () => [
      { label: "Home", path: "/" },
      { label: "Favourites", path: "/favourites" },
      { label: "Account", path: "/account" },
      { label: "Binders", path: "/binders" },
    ],
    []
  );

  const totalStaged = stagedEntries.reduce((total, [, entry]) => total + entry.qty, 0);

  return (
    <div className="binder-desktop">
      <div className="binder-window">
        <header className="binder-window__header">
          <div className="binder-window__controls">
            <span className="window-dot window-dot--close" />
            <span className="window-dot window-dot--min" />
            <span className="window-dot window-dot--max" />
          </div>
          <nav className="binder-window__tabs">
            {navTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                className={`binder-tab ${
                  tab.label === "Binders" ? "binder-tab--active" : ""
                }`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="binder-window__status" />
        </header>

        <div className="binder-window__body">
          <section className="binder-stage">
            <header className="binder-stage__header">
              <div>
                <h1 className="binder-stage__title">Add Cards</h1>
                <p className="binder-stage__subtitle">
                  {binderId ? `Binder #${binderId}` : "Select a binder to continue"}
                </p>
              </div>
              <div className="binder-stage__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    binderId ? navigate(`/binder/${binderId}`) : navigate("/binders")
                  }
                >
                  Back to Binder
                </button>
                <button
                  type="button"
                  className="btn btn-blue"
                  onClick={() => binderId && navigate(`/binder/${binderId}`)}
                  disabled={!binderId}
                >
                  View Binder
                </button>
              </div>
            </header>

            <div className="binder-stage__canvas">
              <div className="binder-canvas-panel">
                {accountError && (
                  <p className="binder-alert" role="alert">
                    {accountError}
                  </p>
                )}
                {searchError && (
                  <p className="binder-alert" role="alert">
                    {searchError}
                  </p>
                )}

                <form className="binder-search binder-search--futuristic" onSubmit={(e) => e.preventDefault()}>
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
                      <option key={type} value={type}>
                        {type}
                      </option>
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
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
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
                  <button type="submit" className="btn btn-blue">
                    Search
                  </button>
                </form>

                <div className="binder-search-pagination">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={searchPage === 0 || searchLoading}
                    onClick={() => setSearchPage((prev) => Math.max(prev - 1, 0))}
                  >
                    Previous
                  </button>
                  <span>
                    Page {searchPage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-blue"
                    disabled={searchPage + 1 >= totalPages || searchLoading}
                    onClick={() => setSearchPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  >
                    Next
                  </button>
                </div>

                <div className="binder-stage__content">{catalogContent()}</div>
              </div>
            </div>
          </section>

          <aside className="binder-sidebar">
            <div className="binder-sidebar__panel binder-sidebar__panel--preview">
              <h3 className="binder-panel__title">Card Preview</h3>
              {selectedCard ? (
                <div className="binder-card-preview">
                  <img
                    src={selectedCard.imageUrl || selectedCard.image_url}
                    alt={selectedCard.name}
                  />
                  <div className="binder-card-preview__meta">
                    <h4>{selectedCard.name}</h4>
                    <p>{selectedCard.set_name}</p>
                    {selectedCard.rarity && <span>{selectedCard.rarity}</span>}
                  </div>
                </div>
              ) : (
                <p className="binder-panel__placeholder">
                  Select a card to preview it here.
                </p>
              )}
            </div>

            <div className="binder-sidebar__panel binder-sidebar__panel--summary">
              <h3 className="binder-panel__title">Pending Summary</h3>
              <p className="binder-panel__text">
                Stage cards from the catalog on the left, then save to update your binder.
              </p>
              <ul className="binder-panel__list">
                <li>
                  <span>Total catalog cards</span>
                  <strong>{searchTotal}</strong>
                </li>
                <li>
                  <span>Pending additions</span>
                  <strong>{totalStaged}</strong>
                </li>
                <li>
                  <span>Binder linked</span>
                  <strong>{binderId ? `#${binderId}` : "None"}</strong>
                </li>
              </ul>
            </div>

            <div className="binder-sidebar__panel binder-sidebar__panel--categories">
              <div className="binder-panel__header">
                <h3 className="binder-panel__title">Pending Additions</h3>
                <button
                  className="btn btn-secondary btn-secondary--small"
                  onClick={handleClear}
                  disabled={stagedEntries.length === 0 || saving}
                >
                  Clear
                </button>
              </div>

              {stagedEntries.length === 0 ? (
                <p className="binder-panel__placeholder">No pending additions yet.</p>
              ) : (
                <div className="binder-checkout-list binder-checkout-list--sidebar">
                  {stagedEntries.map(([cardId, { card, qty }]) => (
                    <div key={cardId} className="binder-checkout-item">
                      <div className="binder-checkout-info">
                        <span className="name">{card.name}</span>
                        {card.number && <span className="meta">{card.number}</span>}
                        {card.rarity && <span className="badge">{card.rarity}</span>}
                      </div>
                      <div className="binder-checkout-actions">
                        <button
                          className="circle-btn xs minus"
                          onClick={() => handleStageDecrement(cardId)}
                          aria-label="Decrease staged quantity"
                        >
                          −
                        </button>
                        <span className="qty-pill xs">{qty}</span>
                        <button
                          className="circle-btn xs plus"
                          onClick={() => handleStageIncrement(card)}
                          aria-label="Increase staged quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="binder-panel__footer">
                <div className="binder-panel__summary">
                  Total staged: {totalStaged}
                </div>
                <button
                  className="btn btn-blue"
                  onClick={handleSave}
                  disabled={stagedEntries.length === 0 || saving || !accountId}
                >
                  {saving ? "Saving..." : "Save to Binder"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedCard && (
        <CardModal
          card={{
            ...selectedCard,
            imageUrl: selectedCard.imageUrl,
          }}
          onClose={() => setSelectedCard(null)}
          onRemove={() => handleStageDecrement(selectedCard.id)}
          removeLabel="Remove staged"
        />
      )}

      {toast && (
        <div className={`binder-toast binder-toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}
