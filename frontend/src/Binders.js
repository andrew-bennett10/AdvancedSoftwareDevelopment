import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function Binders() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [binders, setBinders] = useState([]);
  const [error, setError] = useState(null);

  // Check if user is logged in on component mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/');
        return;
      }
    } else {
      // No user data found, redirect to login
      navigate('/');
      return;
    }
  }, [navigate]);

  // Fetch binders from backend
  useEffect(() => {
    if (!user) return; // wait until auth check completes

    const fetchBinders = async () => {
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://localhost:12343/api';
        const origin = base.replace(/\/api\/?$/, '');
        const res = await fetch(`${origin}/binders`);
        if (!res.ok) {
          setError('Failed to fetch binders.');
          return;
        }
        const data = await res.json();
        setBinders(data.binders || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching binders:', err);
        setError('Failed to fetch binders.');
      }
    };

    fetchBinders();
  }, [user]);

  return (
    <div>
      <NavigationBar activePage="binders" />

      {/* Binder Creation Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow">
              <h2 className="text-center mb-4">Binders</h2>
                {/* List binders from DB */}
                <div className="mt-4">
                  {error && <p className="text-danger">{error}</p>}
                  {!error && binders.length === 0 ? (
                    <p>No binders found.</p>
                  ) : (
                    binders.map((b) => (
                      <div key={b.id} className="d-flex align-items-center mb-2 justify-content-between">
                        <p className="mb-0 flex-grow-1 pe-2">
                          {b.title || b.name || 'Untitled Binder'}
                          {b.format ? ` • ${b.format}` : ''}
                        </p>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary px-3"
                            onClick={() => navigate(`/binder/${b.id}`, { state: { binderId: b.id } })}
                          >View
                          </button>
                          <button
                            className="btn btn-sm btn-dark px-3"
                            onClick={() => navigate(`/binder/${b.id}/add`)}
                          >Add Cards
                          </button>
                          <button
                            className="btn btn-sm btn-primary px-3"
                            onClick={() => navigate('/edit-binder', { state: { id: b.id } })}
                          >Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={() => navigate('/create-binder')}
                >Create Binder
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Binders;
