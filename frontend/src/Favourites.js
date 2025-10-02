import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Favourites.css';

const BACKEND_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
const CARD_API_URL = 'https://api.pokemontcg.io/v2/cards';
const RESULTS_PER_POKEMON = 6;

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const promptSafe = (message, defaultValue = '') => {
  if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
    return null;
  }
  return window.prompt(message, defaultValue);
};

const confirmSafe = (message) => {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
    return false;
  }
  return window.confirm(message);
};

function safeParseUser() {
  try {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function Favourites() {
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favError, setFavError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(null);
  const [focusedCardId, setFocusedCardId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  const categoriesHydrated = useRef(false);

  const user = safeParseUser();
  const userId = user?.id || 1; // TODO: replace fallback once auth is wired everywhere

  const storageKey = useMemo(() => `favouriteCategories:${userId}`, [userId]);

  const filteredFavourites = useMemo(() => {
    if (selectedCategoryId === 'all') return favourites;
    const category = categories.find((cat) => cat.id === selectedCategoryId);
    if (!category) return favourites;
    const ids = new Set((category.favouriteIds || []).map(String));
    return favourites.filter((fav) => ids.has(String(fav.id)));
  }, [selectedCategoryId, categories, favourites]);

  const activeFavourite = filteredFavourites[activeIndex] ?? null;
  const activeFavouriteKey = activeFavourite
    ? `${activeFavourite.id ?? 'anon'}::${activeFavourite.name ?? ''}`
    : null;
  const focusedCard = useMemo(
    () => cards.find((card) => card.id === focusedCardId) || cards[0] || null,
    [cards, focusedCardId]
  );
  const currentCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    function handleFavouriteCreated(event) {
      const favourite = event.detail?.favourite;
      if (!favourite) return;
      const mapped = {
        id: favourite.id,
        name: favourite.card_title,
        description: favourite.card_description,
        imageUrl: favourite.card_image_url,
        timestamp: favourite.created_at,
      };
      setFavourites((prev) => {
        if (prev.some((fav) => String(fav.id) === String(mapped.id))) {
          return prev;
        }
        return [mapped, ...prev];
      });
      if (selectedCategoryId === 'all') {
        setActiveIndex(0);
      }
    }

    window.addEventListener('favourite:created', handleFavouriteCreated);
    return () => {
      window.removeEventListener('favourite:created', handleFavouriteCreated);
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCategories(
            parsed.map((cat) => ({
              id: cat.id ?? makeId(),
              name: cat.name || 'Unnamed category',
              favouriteIds: Array.isArray(cat.favouriteIds)
                ? cat.favouriteIds.map(String)
                : [],
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load favourite categories', err);
      localStorage.removeItem(storageKey);
    } finally {
      categoriesHydrated.current = true;
    }
  }, [storageKey]);

  useEffect(() => {
    if (!categoriesHydrated.current) return;
    localStorage.setItem(storageKey, JSON.stringify(categories));
  }, [categories, storageKey]);

  useEffect(() => {
    const favouriteIdSet = new Set(favourites.map((fav) => String(fav.id)));
    setCategories((prev) => {
      let changed = false;
      const sanitized = prev.map((cat) => {
        const filtered = (cat.favouriteIds || []).filter((id) => favouriteIdSet.has(String(id)));
        if (filtered.length !== (cat.favouriteIds || []).length) {
          changed = true;
          return { ...cat, favouriteIds: filtered };
        }
        return cat;
      });
      return changed ? sanitized : prev;
    });
  }, [favourites]);

  useEffect(() => {
    if (selectedCategoryId === 'all') return;
    if (!categories.some((cat) => cat.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id || 'all');
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setActiveIndex((idx) =>
      filteredFavourites.length === 0 ? 0 : Math.min(idx, filteredFavourites.length - 1)
    );
  }, [filteredFavourites.length]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFavourites() {
      setFavLoading(true);
      setFavError(null);
      try {
        const res = await fetch(`${BACKEND_BASE}/api/favourites?userId=${userId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (data || []).map((row) => ({
          id: row.id,
          name: row.card_title,
          description: row.card_description,
          imageUrl: row.card_image_url,
          timestamp: row.created_at,
        }));
        setFavourites(mapped);
        setActiveIndex((idx) => (mapped.length === 0 ? 0 : Math.min(idx, mapped.length - 1)));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setFavError(err.message || 'Failed to load favourites');
        }
      } finally {
        setFavLoading(false);
      }
    }

    loadFavourites();
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!activeFavourite || !activeFavourite.name) {
      setCards([]);
      setCardsError(null);
      setFocusedCardId(null);
      return;
    }

    const controller = new AbortController();

    async function loadCards() {
      setCardsLoading(true);
      setCardsError(null);
      try {
        const searchName = activeFavourite.name.trim();
        const query = encodeURIComponent(`name:"${searchName}" supertype:Pokemon`);
        const url = `${CARD_API_URL}?q=${query}&pageSize=${RESULTS_PER_POKEMON}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Card API error ${res.status}`);
        const payload = await res.json();
        const mapped = (payload?.data || []).map((card) => ({
          id: card.id,
          name: card.name,
          image: card.images?.large || card.images?.small || '',
          setName: card.set?.name || 'Unknown Set',
          rarity: card.rarity || 'Unknown rarity',
          types: card.types || [],
          subtypes: card.subtypes || [],
        }));
        setCards(mapped);
        setFocusedCardId(mapped[0]?.id || null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCards([]);
          setCardsError(err.message || 'Failed to load cards');
          setFocusedCardId(null);
        }
      } finally {
        setCardsLoading(false);
      }
    }

    loadCards();
    return () => controller.abort();
  }, [activeFavouriteKey, activeFavourite]);

  const handleFavouriteSelect = (index) => {
    setActiveIndex(index);
  };

  const handleCardSelect = (cardId) => {
    setFocusedCardId(cardId);
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveIndex(0);
  };

  const handleAddCategory = () => {
    const name = promptSafe('Name your new category:');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const newCategory = {
      id: makeId(),
      name: trimmed,
      favouriteIds: [],
    };
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategoryId(newCategory.id);
  };

  const handleRenameCategory = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;
    const name = promptSafe('Rename category', category.name);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) return;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, name: trimmed } : cat))
    );
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;
    const confirmed = confirmSafe(`Delete category "${category.name}"?`);
    if (!confirmed) return;
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId('all');
    }
  };

  const handleToggleFavouriteInCategory = (categoryId, favouriteId) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const favKey = String(favouriteId);
        const has = cat.favouriteIds.includes(favKey);
        return {
          ...cat,
          favouriteIds: has
            ? cat.favouriteIds.filter((id) => id !== favKey)
            : [...cat.favouriteIds, favKey],
        };
      })
    );
  };

  const jumpTo = (path) => {
    navigate(path);
  };

  const goBack = () => navigate(-1);
  const goForward = () => navigate(1);

  return (
    <div className="favourites-page">
      <div className="favourites-root">
        <div className="pokedex-frame">
          <header className="pokedex-top">
            <div className="pokedex-left">
              <button
                type="button"
                className="pokedex-lens"
                onClick={() => jumpTo('/home')}
                aria-label="Go to home"
              />
              <div className="pokedex-lights">
                <button
                  type="button"
                  className="light green"
                  onClick={goBack}
                  aria-label="Go back"
                />
                <button
                  type="button"
                  className="light yellow"
                  onClick={goForward}
                  aria-label="Go forward"
                />
                <button
                  type="button"
                  className="light red"
                  onClick={() => jumpTo('/binders')}
                  aria-label="Open binders"
                />
              </div>
            </div>
            <nav className="pokedex-nav">
              <button
                type="button"
                className="nav-chip"
                onClick={() => jumpTo('/home')}
              >
                Home
              </button>
              <button
                type="button"
                className="nav-chip active"
                onClick={() => jumpTo('/favourites')}
                aria-current="page"
              >
                Favourites
              </button>
              <button
                type="button"
                className="nav-chip"
                onClick={() => jumpTo('/account')}
              >
                Account
              </button>
              <button
                type="button"
                className="nav-chip"
                onClick={() => jumpTo('/binders')}
              >
                Binders
              </button>
            </nav>
            <div className="pokedex-camera">
              <span />
              <span />
            </div>
          </header>

        <div className="pokedex-body">
          <main className="pokedex-main">
            <div className="main-surface">
              <div className="main-inner">
                <div className="favourite-strip">
                  {filteredFavourites.map((fav, index) => (
                    <button
                      key={fav.id}
                      type="button"
                      className={`favourite-chip${index === activeIndex ? ' active' : ''}`}
                      onClick={() => handleFavouriteSelect(index)}
                    >
                      {fav.name || 'Unnamed card'}
                    </button>
                  ))}
                  {filteredFavourites.length === 0 && !favLoading && (
                    <span className="strip-empty">
                      {selectedCategoryId === 'all'
                        ? 'Add a favourite to start exploring cards.'
                        : 'No favourites assigned to this category yet.'}
                    </span>
                  )}
                  {favLoading && <span className="strip-empty">Fetching your favourites…</span>}
                </div>

                <div className="main-display">
                  {favError ? (
                    <div className="main-message error">{favError}</div>
                  ) : filteredFavourites.length === 0 ? (
                    <div className="main-message">
                      {selectedCategoryId === 'all'
                        ? favLoading
                          ? 'Fetching your favourites…'
                          : 'Add a favourite to start exploring cards.'
                        : 'Assign favourites to this category to see matching cards here.'}
                    </div>
                  ) : cardsLoading ? (
                    <div className="main-message">Loading cards…</div>
                  ) : cardsError ? (
                    <div className="main-message error">{cardsError}</div>
                  ) : cards.length === 0 ? (
                    <div className="main-message">
                      No cards found for this favourite yet.
                    </div>
                  ) : (
                    <div className="card-grid">
                      {cards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          className={`card-tile${card.id === focusedCard?.id ? ' active' : ''}`}
                          onClick={() => handleCardSelect(card.id)}
                        >
                          {card.image ? (
                            <img src={card.image} alt={card.name} loading="lazy" />
                          ) : (
                            <span className="card-placeholder">{card.name}</span>
                          )}
                          <span className="card-title">{card.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <footer className="main-footer">
              <div className="footer-label">Favourite details</div>
              {activeFavourite ? (
                <div className="footer-content">
                  <div>
                    <h2>{activeFavourite.name}</h2>
                    {activeFavourite.description ? (
                      <p>{activeFavourite.description}</p>
                    ) : (
                      <p className="muted">No description yet. Add one from the account page.</p>
                    )}
                  </div>
                  <div className="footer-meta">
                    {activeFavourite.timestamp && (
                      <span>Saved {new Date(activeFavourite.timestamp).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="footer-content">
                  <p className="muted">No favourite selected.</p>
                </div>
              )}
            </footer>
          </main>

          <aside className="pokedex-side">
            <div className="side-screen">
              {focusedCard?.image ? (
                <img src={focusedCard.image} alt={focusedCard.name} />
              ) : (
                <div className="side-screen-placeholder">Select a card to preview it here.</div>
              )}
            </div>

            <div className="side-info">
              <h3>Card summary</h3>
              {focusedCard ? (
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{focusedCard.name}</dd>
                  </div>
                  <div>
                    <dt>Set</dt>
                    <dd>{focusedCard.setName}</dd>
                  </div>
                  <div>
                    <dt>Rarity</dt>
                    <dd>{focusedCard.rarity}</dd>
                  </div>
                  {focusedCard.types.length > 0 && (
                    <div>
                      <dt>Types</dt>
                      <dd>{focusedCard.types.join(', ')}</dd>
                    </div>
                  )}
                  {focusedCard.subtypes.length > 0 && (
                    <div>
                      <dt>Subtypes</dt>
                      <dd>{focusedCard.subtypes.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="muted">Pick a card from the main screen to see its info.</p>
              )}
            </div>

            <div className="category-panel">
              <div className="category-header">
                <span>Favourite categories</span>
                <button type="button" className="category-add" onClick={handleAddCategory}>
                  + Category
                </button>
              </div>
              <div className="category-grid">
                <button
                  type="button"
                  className={`category-card${selectedCategoryId === 'all' ? ' active' : ''}`}
                  onClick={() => handleSelectCategory('all')}
                >
                  <span className="category-name">All favourites</span>
                  <span className="category-count">{favourites.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card${selectedCategoryId === cat.id ? ' active' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">{cat.favouriteIds.length}</span>
                  </button>
                ))}
              </div>

              {currentCategory && (
                <div className="category-manager">
                  <div className="category-manager-header">
                    <h4>{currentCategory.name}</h4>
                    <div className="category-manager-actions">
                      <button type="button" onClick={() => handleRenameCategory(currentCategory.id)}>
                        Rename
                      </button>
                      <button type="button" onClick={() => handleDeleteCategory(currentCategory.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="category-manager-body">
                    <p className="muted">Assign favourites to this category:</p>
                    {favError ? (
                      <div className="main-message error">{favError}</div>
                    ) : favourites.length === 0 && !favLoading ? (
                      <div className="empty-state">No favourites yet.</div>
                    ) : (
                      <div className="category-assign-list">
                        {favourites.map((fav) => {
                          const favKey = String(fav.id);
                          const checked = currentCategory.favouriteIds.includes(favKey);
                          return (
                            <label key={fav.id} className="category-assign-item">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleFavouriteInCategory(currentCategory.id, fav.id)}
                              />
                              <span>{fav.name || 'Unnamed card'}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Favourites;
