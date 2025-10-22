import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageLayout from './components/PageLayout';
import './Favourites.css';
import './components/CardGallary.css';
import CardTile from './components/CardTile';
import { searchCards as searchLocalCards } from './lib/api/cards';

const BACKEND_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
const RESULTS_PER_POKEMON = 9;

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

    async function loadCards() {
      setCardsLoading(true);
      setCardsError(null);
      try {
        const searchName = activeFavourite.name.trim();
        const payload = await searchLocalCards({ q: searchName, limit: RESULTS_PER_POKEMON });
        const mapped = (payload?.items || []).map((card) => ({
          id: card.id,
          name: card.name,
          image: card.image_url || activeFavourite.imageUrl || '',
          setName: card.set_name || activeFavourite.description || 'Favourite card',
          rarity: card.rarity || 'Favourite',
          types: card.type ? [card.type] : [],
          subtypes: [],
        }));

        const selectedCards =
          mapped.length > 0
            ? mapped.slice(0, RESULTS_PER_POKEMON)
            : [
                {
                  id: `favourite-${activeFavourite.id}`,
                  name: activeFavourite.name,
                  image: activeFavourite.imageUrl || '',
                  setName: activeFavourite.description || 'Favourite card',
                  rarity: 'Favourite',
                  types: [],
                  subtypes: [],
                },
              ];
        setCards(selectedCards);
        setFocusedCardId(selectedCards[0]?.id || null);
      } catch (err) {
        const fallback = [
          {
            id: `favourite-${activeFavourite.id}`,
            name: activeFavourite.name,
            image: activeFavourite.imageUrl || '',
            setName: activeFavourite.description || 'Favourite card',
            rarity: 'Favourite',
            types: [],
            subtypes: [],
          },
        ];
        setCards(fallback);
        setCardsError(null);
        setFocusedCardId(fallback[0].id);
      } finally {
        setCardsLoading(false);
      }
    }

    loadCards();
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

  const handleDeleteFavourite = async (favouriteId) => {
    if (!favouriteId) return;
    const confirmed =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Remove this card from favourites?')
        : true;
    if (!confirmed) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/favourites/${favouriteId}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || `Failed to delete favourite (${res.status})`);
      }
      setFavourites((prev) => prev.filter((fav) => String(fav.id) !== String(favouriteId)));
      setFavError(null);
    } catch (err) {
      console.error('Failed to delete favourite', err);
      setFavError(err.message || 'Failed to delete favourite');
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(err.message || 'Failed to delete favourite');
      }
    }
  };

  return (
    <PageLayout
      activePage="favourites"
      title="Favourites"
      description="Curate your go-to cards and organise them in custom categories."
    >
      <div className="page-grid favourites-layout">
        <section className="page-surface page-stack page-stack--lg">
          <div className="page-stack page-stack--sm">
            <h2 className="h6 text-uppercase text-secondary mb-1">Saved cards</h2>
            <p className="text-muted mb-0">
              Select a favourite to explore matching prints and organise them in categories.
            </p>
          </div>

          <div className="favourites-chip-list">
            {filteredFavourites.map((fav, index) => (
              <button
                key={fav.id}
                type="button"
                className={`favourites-chip${index === activeIndex ? ' favourites-chip--active' : ''}`}
                onClick={() => handleFavouriteSelect(index)}
              >
                {fav.name || 'Unnamed card'}
              </button>
            ))}
            {filteredFavourites.length === 0 && !favLoading ? (
              <span className="favourites-chip-empty">
                {selectedCategoryId === 'all'
                  ? 'Add a favourite to start exploring cards.'
                  : 'No favourites assigned to this category yet.'}
              </span>
            ) : null}
          </div>

          {favLoading ? (
            <div className="favourites-status">Fetching your favourites…</div>
          ) : favError ? (
            <div className="alert alert-danger mb-0" role="alert">
              {favError}
            </div>
          ) : filteredFavourites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">💡</div>
              <p className="empty-state__title">No favourites here yet</p>
              <p className="empty-state__subtitle">
                {selectedCategoryId === 'all'
                  ? 'Save cards from the Pokédex search to populate this space.'
                  : 'Assign favourites to this category to see them listed here.'}
              </p>
            </div>
          ) : (
            <>
              {cardsLoading ? (
                <div className="favourites-status">Loading cards…</div>
              ) : cardsError ? (
                <div className="alert alert-warning mb-0" role="alert">
                  {cardsError}
                </div>
              ) : cards.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🧭</div>
                  <p className="empty-state__title">No matching cards</p>
                  <p className="empty-state__subtitle">
                    Try updating the card name to find available prints.
                  </p>
                </div>
              ) : (
                <div className="favourites-card-grid gallery-grid">
                  {cards.map((card) => (
                    <CardTile
                      key={card.id}
                      card={{ ...card, imageUrl: card.image, image: card.image }}
                      onView={(cardId) => handleCardSelect(cardId)}
                      qty={null}
                    />
                  ))}
                </div>
              )}

              <div className="soft-panel">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div>
                    <h3 className="h5 mb-1">{activeFavourite?.name || 'Favourite details'}</h3>
                    {activeFavourite?.description ? (
                      <p className="text-muted mb-0">{activeFavourite.description}</p>
                    ) : (
                      <p className="text-muted mb-0">
                        Add a description from the account page to remember why you love this card.
                      </p>
                    )}
                  </div>
                  {activeFavourite?.timestamp ? (
                    <span className="badge bg-secondary">
                      Saved {new Date(activeFavourite.timestamp).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                {activeFavourite ? (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteFavourite(activeFavourite.id)}
                    >
                      Remove from favourites
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>

        <aside className="favourites-aside">
          <div className="page-stack sticky-pane">
            <section className="page-surface page-stack page-stack--sm favourites-preview">
              <div className="favourites-preview__frame">
                {focusedCard?.image ? (
                  <img src={focusedCard.image} alt={focusedCard.name} />
                ) : (
                  <div className="favourites-preview__placeholder">
                    Select a card to preview it here.
                  </div>
                )}
              </div>
              <div>
                <h3 className="h6 text-uppercase text-secondary mb-2">Card summary</h3>
                {focusedCard ? (
                  <dl className="favourites-preview__details">
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
                    {focusedCard.types.length > 0 ? (
                      <div>
                        <dt>Types</dt>
                        <dd>{focusedCard.types.join(', ')}</dd>
                      </div>
                    ) : null}
                    {focusedCard.subtypes.length > 0 ? (
                      <div>
                        <dt>Subtypes</dt>
                        <dd>{focusedCard.subtypes.join(', ')}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-muted mb-0">Pick a card from the list to see its details.</p>
                )}
              </div>
            </section>

            <section className="page-surface page-stack page-stack--sm">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <h3 className="h6 text-uppercase text-secondary mb-0">Categories</h3>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleAddCategory}>
                  + Category
                </button>
              </div>
              <div className="favourites-category-list">
                <button
                  type="button"
                  className={`favourites-category${selectedCategoryId === 'all' ? ' favourites-category--active' : ''}`}
                  onClick={() => handleSelectCategory('all')}
                >
                  <span>All favourites</span>
                  <span className="favourites-category__count">{favourites.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`favourites-category${selectedCategoryId === cat.id ? ' favourites-category--active' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span>{cat.name}</span>
                    <span className="favourites-category__count">{cat.favouriteIds.length}</span>
                  </button>
                ))}
              </div>

              {currentCategory ? (
                <div className="soft-panel favourites-category-manager">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <h4 className="h6 mb-0">{currentCategory.name}</h4>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleRenameCategory(currentCategory.id)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCategory(currentCategory.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-muted small mb-3">Assign favourites to this category:</p>
                  {favLoading ? (
                    <div className="favourites-status">Loading favourites…</div>
                  ) : favourites.length === 0 ? (
                    <p className="text-muted mb-0">No favourites yet.</p>
                  ) : (
                    <div className="favourites-category-assignment">
                      {favourites.map((fav) => {
                        const favKey = String(fav.id);
                        const checked = currentCategory.favouriteIds.includes(favKey);
                        return (
                          <label key={fav.id} className="favourites-category-assignment__item">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleToggleFavouriteInCategory(currentCategory.id, fav.id)
                              }
                            />
                            <span>{fav.name || 'Unnamed card'}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}

export default Favourites;
