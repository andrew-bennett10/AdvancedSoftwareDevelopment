import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';
import FavouriteButton from './components/FavouriteButton';
import { searchCards as searchLocalCards } from './lib/api/cards';
const RESULTS_PER_PAGE = 9;

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [cards, setCards] = useState([]);

  // Check if user is logged in on component mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    console.log('Raw userData from localStorage:', userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/');
        return;
      }
    } else {
      // No user data found, redirect to login
      console.log('No user data found, redirecting to login');
      navigate('/');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Load a starter set so the page doesn't feel empty
    setSearchTerm('pikachu');
    applySearch('pikachu');
  }, []);

  const applySearch = async (term) => {
    const query = term.trim();
    if (!query) {
      setCards([]);
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const payload = await searchLocalCards({ q: query, limit: RESULTS_PER_PAGE });
      const transformed = (payload?.items || []).map((card) => ({
        id: card.id,
        name: card.name,
        image: card.image_url || '',
        setName: card.set_name || 'Unknown set',
        rarity: card.rarity || 'Unknown rarity',
        types: card.type ? [card.type] : [],
      }));
      setCards(transformed);
    } catch (err) {
      console.error('Failed to fetch cards', err);
      setSearchError(err?.message || 'Could not load cards. Try a different name.');
      setCards([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applySearch(searchTerm);
  };

  const displayName = user?.username || user?.email || 'Trainer';

  return (
    <PageLayout
      activePage="home"
      title={`Welcome ${displayName}!`}
      description="Search the Pokédex to discover new cards and grow your collection."
    >
      <section className="page-surface page-stack">
        <div className="page-stack page-stack--sm">
          <header>
            <h2 className="h4 mb-2 text-uppercase text-secondary">Search the Pokédex</h2>
            <p className="text-muted mb-0">
              Find cards you love and add them straight to your favourites or a binder.
            </p>
          </header>
          <form className="card-search-form" onSubmit={handleSearchSubmit}>
            <div className="input-group input-group-lg">
              <input
                type="text"
                className="form-control"
                placeholder="Search Pokémon by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={searching || !searchTerm.trim()}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </form>
          {searchError ? (
            <div className="alert alert-danger mb-0" role="alert">
              {searchError}
            </div>
          ) : null}
        </div>

        <div className="card-grid">
          {cards.map((card) => (
            <div key={card.id} className="card">
              {card.image ? (
                <img src={card.image} className="card-img-top" alt={card.name} loading="lazy" />
              ) : null}
              <div className="card-body">
                <div>
                  <h3 className="h5 mb-1">{card.name}</h3>
                  <div className="text-muted small">
                    <div>{card.setName}</div>
                    <div>{card.rarity}</div>
                    {card.types.length > 0 ? (
                      <div>Type: {card.types.join(', ')}</div>
                    ) : null}
                  </div>
                </div>
                <FavouriteButton
                  card={{
                    title: card.name,
                    description: `${card.setName} · ${card.rarity}`,
                    imageUrl: card.image,
                  }}
                >
                  Add to favourites
                </FavouriteButton>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && !searching ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔍</div>
            <p className="empty-state__title">No cards yet</p>
            <p className="empty-state__subtitle">
              Try a different Pokémon name to see matching cards.
            </p>
          </div>
        ) : null}
      </section>
    </PageLayout>
  );
}

export default Home;
