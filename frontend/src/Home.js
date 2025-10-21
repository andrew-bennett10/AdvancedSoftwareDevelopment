import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';
import FavouriteButton from './components/FavouriteButton';

const CARD_API_URL = 'https://api.pokemontcg.io/v2/cards';
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
      const encoded = encodeURIComponent(`name:"${query}" supertype:Pokemon`);
      const res = await fetch(`${CARD_API_URL}?q=${encoded}&pageSize=${RESULTS_PER_PAGE}`);
      if (!res.ok) {
        throw new Error(`Card search failed (${res.status})`);
      }
      const payload = await res.json();
      const transformed = (payload?.data || []).map((card) => ({
        id: card.id,
        name: card.name,
        image: card.images?.large || card.images?.small || '',
        setName: card.set?.name || 'Unknown set',
        rarity: card.rarity || 'Unknown rarity',
        types: card.types || [],
      }));
      setCards(transformed);
    } catch (err) {
      console.error('Failed to fetch cards', err);
      setSearchError('Could not load cards. Try a different name.');
      setCards([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applySearch(searchTerm);
  };

  return (
    <div>
      <NavigationBar activePage="home" />

      {/* Component content */}
      <div className="container mt-4">
        <div className="text-center mt-5">
          <h1>Welcome {user?.username || user?.email || 'User'}!</h1>
          <p>You are successfully logged in.</p>
        </div>

        <section className="mt-5">
          <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
            <div>
              <h2 className="h4 mb-1">Search the Pokédex</h2>
              <p className="text-muted mb-0">Find a card and add it to your favourites from here.</p>
            </div>
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
            <div className="alert alert-danger mt-3" role="alert">
              {searchError}
            </div>
          ) : null}

          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 mt-1 card-search-results">
            {cards.map((card) => (
              <div key={card.id} className="col">
                <div className="card h-100 shadow-sm">
                  {card.image ? (
                    <img src={card.image} className="card-img-top" alt={card.name} loading="lazy" />
                  ) : null}
                  <div className="card-body d-flex flex-column gap-2">
                    <h3 className="h5 mb-0">{card.name}</h3>
                    <div className="text-muted small">
                      <div>{card.setName}</div>
                      <div>{card.rarity}</div>
                      {card.types.length > 0 ? (
                        <div>Type: {card.types.join(', ')}</div>
                      ) : null}
                    </div>
                    <FavouriteButton
                      card={{
                        title: card.name,
                        description: `${card.setName} · ${card.rarity}`,
                        imageUrl: card.image,
                      }}
                      className="mt-auto"
                    >
                      Add to favourites
                    </FavouriteButton>
                  </div>
                </div>
              </div>
            ))}
            {cards.length === 0 && !searching ? (
              <div className="col">
                <div className="alert alert-info mt-3" role="alert">
                  Start by searching for a Pokémon card above.
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
