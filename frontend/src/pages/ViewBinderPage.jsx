/**
 * ViewBinderPage – read-only binder view with card grid and detail modal
 * Endpoints: GET /binders/:id, GET /api/binders/:binderId/cards
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavigationBar from "../NavigationBar";
import CardGallery from "../components/CardGallary";
import CardModal from "../components/CardModal";
import {
  getBinderCards,
  getBinderCard,
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

  const apiOrigin = useMemo(() => {
    const base = process.env.REACT_APP_API_BASE || "http://localhost:12343/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  // Resolve account id once per mount
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

  // Load binder metadata for header
  useEffect(() => {
    if (!binderId) return;
    let active = true;
    setBinderInfoLoading(true);
    fetch(`${apiOrigin}/binders/${binderId}`)
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
  }, [apiOrigin, binderId]);

  const refreshBinderCards = useCallback(async () => {
    if (!binderId) return;
    setCardsLoading(true);
    try {
      const rows = await getBinderCards(binderId);
      const mapped = (rows || []).map(normalizeCard).filter(Boolean);
      mapped.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      const qty = {};
      mapped.forEach((card) => {
        qty[card.card_id] = card.qty;
      });
      setBinderCards(mapped);
      setQuantities(qty);
      setCardsError(null);
    } catch (err) {
      console.error("Binder cards load failed", err);
      setCardsError(err.message || "Failed to load binder contents.");
      setBinderCards([]);
      setQuantities({});
      throw err;
    } finally {
      setCardsLoading(false);
    }
  }, [binderId]);

  useEffect(() => {
    const maybePromise = refreshBinderCards();
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {});
    }
  }, [refreshBinderCards]);

  const handleViewCard = async (cardId) => {
    try {
      const row = await getBinderCard(binderId, cardId);
      const normalized = normalizeCard(row);
      if (normalized) {
        setSelectedCard({ ...normalized, imageUrl: normalized.imageUrl });
      }
    } catch (err) {
      console.error("Card detail load failed", err);
    }
  };

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
      <div className="binder-layout binder-layout--single">
        <main className="binder-main">
          <div className="binder-header">
            <button className="btn btn-link" onClick={() => navigate('/binders')}>&larr; Back</button>
            <div>
              <h1 className="binder-title">{binderInfo?.title || 'Binder'}</h1>
              {binderInfo?.format && <div className="binder-format">Format: {binderInfo.format}</div>}
            </div>
            {binderInfoLoading && <span className="binder-meta-loading">Loading info…</span>}
            <button className="btn btn-blue" onClick={() => navigate(`/binder/${binderId}/add`)}>Edit Binder</button>
          </div>

          <section className="binder-section">
            <h2 className="binder-section-title">Binder Contents</h2>
            {accountError && <p role="alert" style={{ color: '#c00' }}>{accountError}</p>}
            {cardsError && <p role="alert" style={{ color: '#c00' }}>{cardsError}</p>}
            {cardsLoading ? (
              <p>Loading binder cards…</p>
            ) : binderCards.length === 0 ? (
              <div className="binder-empty">
                <p>No cards in this binder yet.</p>
                <button className="btn btn-blue" onClick={() => navigate(`/binder/${binderId}/add`)}>Add Cards</button>
              </div>
            ) : (
              <CardGallery
                cards={binderCards}
                quantities={quantities}
                onView={(cardId) => handleViewCard(cardId)}
              />
            )}
          </section>
        </main>
      </div>

      {selectedCard && (
        <CardModal
          card={{ ...selectedCard, imageUrl: selectedCard.imageUrl || selectedCard.image_url }}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
