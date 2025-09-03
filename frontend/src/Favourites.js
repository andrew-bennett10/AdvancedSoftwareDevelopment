import React, { useEffect, useMemo, useRef, useState } from 'react';
import localCards from './cardsData';

function Favourites() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(0);
  const [wheelSize, setWheelSize] = useState(260);
  const wheelRef = useRef(null);

  // TODO: Replace with real authenticated user id
  const userId = 1;
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    async function fetchFavourites() {
      try {
        const res = await fetch(`${apiBase}/api/favourites?userId=${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Map backend rows -> UI model
        const mapped = (data || []).map((r) => ({
          id: r.id,
          title: r.card_title,
          description: r.card_description,
          image: r.card_image_url,
          created_at: r.created_at,
        }));
        setFavourites(mapped);
      } catch (err) {
        setError(err.message || 'Failed to load favourites');
      } finally {
        setLoading(false);
      }
    }
    fetchFavourites();
  }, [apiBase]);

  // Track container size for responsive wheel layout
  useEffect(() => {
    const update = () => {
      if (wheelRef.current) {
        const w = Math.floor(wheelRef.current.getBoundingClientRect().width);
        // Keep it between 220 and 360 px for usability
        setWheelSize(Math.max(220, Math.min(360, w)));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Force local mode if ?local is present; otherwise fallback to local when backend is empty
  const forceLocal = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.has('local') || sp.get('mode') === 'local';
    } catch (_) {
      return false;
    }
  }, []);

  const items = useMemo(() => {
    if (forceLocal) return localCards;
    if (!loading && favourites.length === 0) return localCards;
    return favourites;
  }, [forceLocal, loading, favourites]);

  const count = items.length;
  const current = count > 0 ? items[active % count] : null;

  const prev = () => setActive((i) => (i - 1 + count) % count);
  const next = () => setActive((i) => (i + 1) % count);
  const goTo = (i) => setActive(i);

  // Wheel layout geometry
  const radius = wheelSize / 2 - 28; // inner radius for thumbnails

  return (
    <div className="bg-light">
      <div className="container py-4">
        <div className="card p-3 p-md-4 shadow mx-auto" style={{ maxWidth: '960px', width: '100%' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={prev} disabled={count === 0}>
            ‹
          </button>
          <h2 className="m-0 flex-grow-1 text-center text-md-start">Favourites {count > 0 ? `(${(active % count) + 1} / ${count})` : ''}</h2>
          <div className="d-flex gap-2 ms-auto">
            <a href="/" className="btn btn-outline-secondary btn-sm">Back</a>
            <button className="btn btn-outline-secondary btn-sm" onClick={next} disabled={count === 0}>
              ›
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-muted">Loading your favourites…</div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            Could not load favourites: {error}
          </div>
        )}

        {!loading && count === 0 && (
          <div className="alert alert-info" role="alert">
            You don’t have any favourites yet. Add some or drop PNGs into <code>public/cards/</code> and update <code>cardsData.js</code>.
          </div>
        )}

        {!loading && count > 0 && (
          <>
            {/* Center card */}
            <div className="row g-3 mb-4">
              <div className="col-12">
                <div className="card shadow-sm">
                  {current?.image ? (
                    <img src={current.image} alt={current.title} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', background: '#f8f9fa' }} />
                  ) : null}
                  <div className="card-body">
                    <h5 className="card-title mb-1">{current?.title}</h5>
                    {current?.description ? (
                      <p className="card-text text-muted mb-2">{current.description}</p>
                    ) : null}
                    <small className="text-muted">Added {current?.created_at ? new Date(current.created_at).toLocaleString() : ''}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Wheel of thumbnails */}
            <div className="d-flex justify-content-center">
              <div
                ref={wheelRef}
                style={{ position: 'relative', width: '100%', maxWidth: 360, height: wheelSize, borderRadius: '50%' }}
              >
                {items.map((item, i) => {
                  const angle = (360 / count) * (i - active);
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.cos(rad) * radius + wheelSize / 2 - 24; // 48 thumb size
                  const y = Math.sin(rad) * radius + wheelSize / 2 - 24;
                  const isActive = i === active % count;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(i)}
                      title={item.title}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        padding: 0,
                        border: isActive ? '2px solid #0d6efd' : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: isActive ? '0 0 0 4px rgba(13,110,253,.15)' : 'none',
                        background: '#fff',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 10 }}>{item.title}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default Favourites;
