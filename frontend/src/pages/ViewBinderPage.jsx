/**
 * ViewBinderPage – binder viewer with edit mode, bulk selection, and modal preview.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CardModal from "../components/CardModal";
import ConfirmationModal from "../components/ConfirmationModal";
import SelectableCardTile from "../components/SelectableCardTile";
import BulkActionBar from "../components/BulkActionBar";
import PageLayout from "../components/PageLayout";
import {
  getBinderCards,
  getBinderCard,
  deleteCard,
  deleteBinderCardsBulk,
} from "../lib/api/binders";
import "./BinderPage.css";

function normalizeCard(row) {
  if (!row) return null;
  return {
    card_id: row.card_id || row.id,
    id: row.card_id || row.id,
    name: row.name,
    qty: row.qty,
    type: row.type,
    rarity: row.rarity,
    number: row.number,
    set: row.set_name,
    set_name: row.set_name,
    imageUrl: row.image_url,
    hp: row.hp,
    weaknesses: row.weaknesses,
    retreat: row.retreat,
  };
}

export default function ViewBinderPage() {
  const navigate = useNavigate();
  const { binderId: binderParam } = useParams();

  const binderId = useMemo(() => {
    const parsed = Number(binderParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [binderParam]);

  const [accountError, setAccountError] = useState(null);
  const [binderInfo, setBinderInfo] = useState(null);
  const [binderInfoLoading, setBinderInfoLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(null);
  const [binderCards, setBinderCards] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [removingCardId, setRemovingCardId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedMap, setSelectedMap] = useState({});
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [toast, setToast] = useState(null);
  const selectAllRef = useRef(null);

  const buildSelectionMeta = useCallback((card) => {
    if (!card) return { key: null, item: null };
    const cardId = card.card_id || card.id;
    if (!cardId) return { key: null, item: null };
    const finishRaw =
      card.finish ??
      card.foil ??
      card.finish_type ??
      card.treatment ??
      "";
    const finish = finishRaw ? String(finishRaw).trim() : "";
    const key = `${cardId}::${finish}`;
    const item = finish ? { cardId, finish } : { cardId };
    return { key, item };
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem("accountId"));
    if (Number.isFinite(stored) && stored > 0) {
      setAccountError(null);
      return;
    }
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.id) {
          const resolved = Number(parsed.id);
          if (Number.isFinite(resolved) && resolved > 0) {
            localStorage.setItem("accountId", String(resolved));
            setAccountError(null);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to parse stored user data", err);
      }
    }
    setAccountError("Please log in again to view this binder.");
  }, []);

  useEffect(() => {
    if (!binderId) return;
    let active = true;
    setBinderInfoLoading(true);
    fetch(
      `${(process.env.REACT_APP_API_BASE || "http://localhost:3001/api").replace(/\/api\/?$/, "")}/binders/${binderId}`
    )
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          throw new Error(`Failed to load binder (${response.status})`);
        }
        const payload = await response.json();
        setBinderInfo(payload.binder || payload);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Binder info load failed", err);
        setCardsError(err.message || "Failed to load binder.");
      })
      .finally(() => {
        if (active) setBinderInfoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [binderId]);

  const refreshBinderCards = useCallback(async () => {
    if (!binderId) return;
    setCardsLoading(true);
    try {
      const rows = await getBinderCards(binderId);
      const mapped = (rows || []).map(normalizeCard).filter(Boolean);
      mapped.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const qty = {};
      const selectionIndex = {};
      mapped.forEach((card) => {
        qty[card.card_id] = card.qty;
        const { key, item } = buildSelectionMeta(card);
        if (key && item) {
          selectionIndex[key] = item;
        }
      });

      setBinderCards(mapped);
      setQuantities(qty);
      setSelectedMap((prev) => {
        if (!editMode) return {};
        const next = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (selectionIndex[key]) {
            next[key] = value;
          }
        });
        return next;
      });
      setCardsError(null);
    } catch (err) {
      console.error("Binder cards load failed", err);
      setCardsError(err.message || "Failed to load binder contents.");
      setBinderCards([]);
      setQuantities({});
      setSelectedMap({});
    } finally {
      setCardsLoading(false);
    }
  }, [binderId, buildSelectionMeta, editMode]);

  useEffect(() => {
    const maybePromise = refreshBinderCards();
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {});
    }
  }, [refreshBinderCards]);

  const handleViewCard = useCallback(
    async (cardId) => {
      if (editMode) return;
      try {
        const row = await getBinderCard(binderId, cardId);
        const normalized = normalizeCard(row);
        if (normalized) {
          setSelectedCard({ ...normalized, imageUrl: normalized.imageUrl });
        }
      } catch (err) {
        console.error("Card detail load failed", err);
      }
    },
    [binderId, editMode]
  );

  const handleRemoveCard = useCallback(
    async (card) => {
      if (!binderId || !card) return;
      const cardId = card.card_id || card.id;
      if (!cardId) return;

      try {
        setRemovingCardId(cardId);
        await deleteCard(binderId, cardId);
        await refreshBinderCards();
        setSelectedCard(null);
        setCardsError(null);
      } catch (err) {
        console.error("Failed to remove card from binder", err);
        setCardsError(err.message || "Failed to remove card from binder.");
      } finally {
        setRemovingCardId(null);
      }
    },
    [binderId, refreshBinderCards]
  );

  const clearSelection = useCallback(() => {
    setSelectedMap({});
  }, []);

  const toggleCardSelection = useCallback(
    (card, explicitChecked) => {
      if (!editMode || bulkRemoving) return;
      const { key, item } = buildSelectionMeta(card);
      if (!key || !item) return;

      setSelectedMap((prev) => {
        const next = { ...prev };
        const shouldSelect =
          typeof explicitChecked === "boolean" ? explicitChecked : !next[key];
        if (shouldSelect) {
          next[key] = item;
        } else {
          delete next[key];
        }
        return next;
      });
    },
    [buildSelectionMeta, editMode, bulkRemoving]
  );

  const selectedEntries = useMemo(
    () => Object.entries(selectedMap),
    [selectedMap]
  );
  const selectedItems = useMemo(
    () => selectedEntries.map(([, item]) => item),
    [selectedEntries]
  );
  const selectedCount = selectedEntries.length;
  const totalVisible = binderCards.length;
  const allSelected = editMode && totalVisible > 0 && selectedCount === totalVisible;

  const openBulkModal = useCallback(() => {
    if (!editMode || selectedCount === 0) return;
    setConfirmBulkOpen(true);
  }, [editMode, selectedCount]);

  const closeBulkModal = useCallback(() => {
    if (bulkRemoving) return;
    setConfirmBulkOpen(false);
  }, [bulkRemoving]);

  const handleBulkRemoveConfirm = useCallback(async () => {
    if (!binderId || selectedItems.length === 0) return;

    try {
      setBulkRemoving(true);
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[ViewBinderPage] bulk remove confirm", {
          binderId,
          selectedItems,
        });
      }

      let removed = 0;
      try {
        const result = await deleteBinderCardsBulk(binderId, selectedItems);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[ViewBinderPage] bulk remove response", result);
        }
        removed = Number(result?.deleted ?? 0);
      } catch (bulkErr) {
        const message = bulkErr?.message || bulkErr?.payload?.error || "";
        const status = bulkErr?.status;
        const shouldFallback =
          status === 404 ||
          status === 405 ||
          message.toLowerCase().includes("not found") ||
          message.toLowerCase().includes("route");

        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[ViewBinderPage] bulk remove failed, attempting fallback", {
            binderId,
            error: {
              status: bulkErr?.status,
              message: bulkErr?.message,
              payload: bulkErr?.payload,
            },
          });
        }

        if (shouldFallback) {
          for (const entry of selectedItems) {
            const cardId = entry.cardId;
            if (!cardId) continue;
            try {
              await deleteCard(binderId, cardId);
              removed += 1;
            } catch (singleErr) {
              console.error("Fallback delete failed", {
                binderId,
                cardId,
                error: singleErr,
              });
            }
          }
        } else {
          throw bulkErr;
        }
      }

      await refreshBinderCards();
      setCardsError(null);
      setConfirmBulkOpen(false);
      clearSelection();
      if (removed > 0) {
        setToast({
          type: "success",
          message:
            removed === 1
              ? "Card removed successfully."
              : `${removed} cards removed successfully.`,
        });
      } else {
        const message = "No cards were removed.";
        setCardsError(message);
        setToast({ type: "error", message });
      }
    } catch (err) {
      console.error("Failed to bulk remove cards", err);
      const message = err.message || "Failed to remove selected cards.";
      setCardsError(message);
      setToast({ type: "error", message });
    } finally {
      setBulkRemoving(false);
    }
  }, [binderId, selectedItems, clearSelection, refreshBinderCards]);

  const handleToggleSelectAll = useCallback(
    (checked) => {
      if (!editMode) return;
      if (!checked) {
        clearSelection();
        return;
      }
      if (binderCards.length === 0) return;
      const next = {};
      binderCards.forEach((card) => {
        const { key, item } = buildSelectionMeta(card);
        if (key && item) {
          next[key] = item;
        }
      });
      setSelectedMap(next);
    },
    [binderCards, buildSelectionMeta, clearSelection, editMode]
  );

  useEffect(() => {
    const checkbox = selectAllRef.current;
    if (!checkbox) return;
    if (!editMode) {
      checkbox.indeterminate = false;
      checkbox.checked = false;
      return;
    }
    checkbox.indeterminate = selectedCount > 0 && selectedCount < totalVisible;
  }, [editMode, selectedCount, totalVisible]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!editMode) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode]);

  useEffect(() => {
    if (!editMode) {
      clearSelection();
      setConfirmBulkOpen(false);
    } else {
      setSelectedCard(null);
    }
  }, [editMode, clearSelection]);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const selectedCardId = selectedCard?.card_id || selectedCard?.id;
  const removingCurrentCard =
    Boolean(selectedCardId) && removingCardId === selectedCardId;

  const previewCard = selectedCard;

  const hasBinder = Boolean(binderId);
  const pageTitle = binderInfo?.title || "Binder";
  const pageDescription = binderInfo?.format
    ? `Format: ${binderInfo.format}`
    : "Explore your collected cards";
  const cardSubtitle = cardsLoading
    ? "Loading cards…"
    : binderCards.length
      ? `${binderCards.length} ${binderCards.length === 1 ? "card" : "cards"} in this binder`
      : "No cards in this binder yet.";
  const headerActions = (
    <div className="binder-header-actions">
      {binderInfoLoading && <span className="binder-header-loading">Loading info…</span>}
      <button
        className="btn btn-blue"
        onClick={() =>
          hasBinder ? navigate(`/binder/${binderId}/add`) : navigate("/binders")
        }
        disabled={!hasBinder}
      >
        Add Cards
      </button>
      <button
        type="button"
        className={`btn ${editMode ? "btn-blue" : "btn-secondary"}`}
        onClick={toggleEditMode}
        aria-pressed={editMode}
        disabled={bulkRemoving}
      >
        {editMode ? "Done" : "Edit"}
      </button>
    </div>
  );

  return (
    <PageLayout
      activePage="binders"
      title={pageTitle}
      description={pageDescription}
      actions={headerActions}
      maxWidth="full"
    >
      <div className="binder-page">
        <div className="binder-shell">
          <div className="binder-main-grid">
            <section className="binder-stage">
              <header className="binder-stage__header">
                <div>
                  <h2 className="binder-stage__title">Binder Cards</h2>
                  <p className="binder-stage__subtitle">{cardSubtitle}</p>
                </div>
                {(cardsLoading || editMode) && (
                  <div className="binder-stage__actions">
                    {cardsLoading && (
                      <span className="binder-stage__loading">Loading cards…</span>
                    )}
                    {editMode && (
                      <label className="binder-header-selectAll">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allSelected}
                          disabled={
                            bulkRemoving || cardsLoading || binderCards.length === 0
                          }
                          onChange={(event) =>
                            handleToggleSelectAll(event.target.checked)
                          }
                          aria-label="Select all visible cards"
                        />
                        <span>Select all</span>
                      </label>
                    )}
                  </div>
                )}
              </header>

              <div className="binder-stage__canvas">
                <div className="binder-canvas-panel">
                {accountError && (
                  <p className="binder-alert" role="alert">
                    {accountError}
                  </p>
                )}
                {cardsError && (
                  <p className="binder-alert" role="alert">
                    {cardsError}
                  </p>
                )}

                {!hasBinder ? (
                  <div className="binder-empty">
                    <p>No binder selected. Head back to your binders list.</p>
                    <button className="btn btn-blue" onClick={() => navigate("/binders")}>
                      Back to Binders
                    </button>
                  </div>
                ) : cardsLoading ? (
                  <div className="binder-empty binder-empty--loading">
                    <p>Loading binder cards…</p>
                  </div>
                ) : binderCards.length === 0 ? (
                  <div className="binder-empty">
                    <p>No cards in this binder yet.</p>
                    <button
                      className="btn btn-blue"
                      onClick={() => navigate(`/binder/${binderId}/add`)}
                    >
                      Add Cards
                    </button>
                  </div>
                ) : (
                  <>
                    {editMode && selectedCount === 0 && (
                      <p className="binder-edit-hint">
                        Select cards to remove them in bulk.
                      </p>
                    )}

                    <div className="gallery-grid gallery-grid--futuristic">
                      {binderCards.map((card, index) => {
                        const cardId = card.card_id || card.id;
                        const qty =
                          (quantities && (quantities[cardId] ?? quantities[card.id])) ??
                          card.qty ??
                          0;
                        const { key } = buildSelectionMeta(card);
                        const selectionKey = key || cardId || `card-${index}`;
                        const isChecked = Boolean(key && selectedMap[key]);
                        return (
                          <SelectableCardTile
                            key={selectionKey}
                            card={card}
                            qty={qty}
                            checked={isChecked}
                            editMode={editMode}
                            onToggle={toggleCardSelection}
                            onView={handleViewCard}
                            disabled={bulkRemoving}
                          />
                        );
                      })}
                    </div>

                    {editMode && selectedCount > 0 && (
                      <BulkActionBar
                        count={selectedCount}
                        onRemove={openBulkModal}
                        onClear={clearSelection}
                        removeDisabled={bulkRemoving}
                        clearDisabled={bulkRemoving}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          <aside className="binder-sidebar">
            <div className="binder-sidebar__panel binder-sidebar__panel--preview">
              <h3 className="binder-panel__title">Card Preview</h3>
              {previewCard ? (
                <div className="binder-card-preview">
                  <img
                    src={previewCard.imageUrl || previewCard.image_url}
                    alt={previewCard.name}
                  />
                  <div className="binder-card-preview__meta">
                    <h4>{previewCard.name}</h4>
                    <p>{previewCard.set_name || previewCard.set}</p>
                    <span>
                      Qty:{" "}
                      {previewCard.qty ??
                        quantities[previewCard.card_id || previewCard.id] ??
                        0}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="binder-panel__placeholder">
                  Select a card to preview it here.
                </p>
              )}
            </div>

            <div className="binder-sidebar__panel binder-sidebar__panel--summary">
              <h3 className="binder-panel__title">Card Summary</h3>
              <p className="binder-panel__text">
                {previewCard
                  ? "Review the card details or remove it while in Edit mode."
                  : "Pick a card from the main panel to see its info."}
              </p>
              <ul className="binder-panel__list">
                <li>
                  <span>Cards</span>
                  <strong>{binderCards.length}</strong>
                </li>
                <li>
                  <span>Total Selected</span>
                  <strong>{selectedCount}</strong>
                </li>
                <li>
                  <span>Format</span>
                  <strong>{binderInfo?.format || "Any"}</strong>
                </li>
              </ul>
            </div>

            <div className="binder-sidebar__panel binder-sidebar__panel--categories">
              <div className="binder-panel__header">
                <h3 className="binder-panel__title">Binder Actions</h3>
                <button
                  className="btn btn-secondary btn-secondary--small"
                  onClick={toggleEditMode}
                >
                  {editMode ? "Finish Editing" : "Edit Mode"}
                </button>
              </div>
              <div className="binder-panel__chip-list">
                <span className="binder-chip">
                  {binderInfo?.title ? binderInfo.title : "Untitled Binder"}
                </span>
                {binderInfo?.format && (
                  <span className="binder-chip binder-chip--outline">
                    {binderInfo.format}
                  </span>
                )}
                <span className="binder-chip binder-chip--accent">
                  {binderCards.length} cards
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
        {selectedCard && (
          <CardModal
            card={{
              ...selectedCard,
              imageUrl: selectedCard.imageUrl || selectedCard.image_url,
            }}
            onClose={() => setSelectedCard(null)}
            onRemove={handleRemoveCard}
            removeDisabled={removingCurrentCard}
            removeLabel={removingCurrentCard ? "Removing…" : "Remove from Binder"}
          />
        )}

        <ConfirmationModal
          isOpen={confirmBulkOpen}
          title="Remove Selected Cards"
          message={`Remove ${selectedCount} card${selectedCount === 1 ? "" : "s"} from this binder?`}
          confirmLabel="Remove"
          cancelLabel="Keep Cards"
          onConfirm={handleBulkRemoveConfirm}
          onCancel={closeBulkModal}
          busy={bulkRemoving}
        />

        {toast && (
          <div
            className={`binder-toast binder-toast--${toast.type}`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
