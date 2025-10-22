import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

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
        const origin = API_BASE.replace(/\/api\/?$/, '');
        const response = await fetch(`${origin}/binders`);
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const message = errorPayload?.error || 'Failed to fetch binders.';
          setError(message);
          return;
        }
        const data = await response.json();
        setBinders(data.binders || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching binders:', err);
        setError('Failed to fetch binders.');
      }
    };

    fetchBinders();
  }, [user]);

  const handleDeleteBinder = async (id) => {
    if (!id) return;
    const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm('Delete this binder? This cannot be undone.')
      : false;
    if (!confirmed) return;
    try {
      const origin = API_BASE.replace(/\/api\/?$/, '');
      const res = await fetch(`${origin}/binders/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || `Delete failed (${res.status})`);
      }
      // remove from state so UI updates immediately
      setBinders((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete binder:', err);
      setError(err.message || 'Failed to delete binder.');
      alert(err.message || 'Failed to delete binder');
    }
  };

  return (
    <PageLayout
      activePage="binders"
      title="Binders"
      description="Organise themed binders and hop back into them whenever inspiration strikes."
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/create-binder')}
        >
          Create Binder
        </button>
      }
    >
      <section className="page-surface page-stack">
        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        {!error && binders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <p className="empty-state__title">No binders yet</p>
            <p className="empty-state__subtitle">
              Start your first binder to group cards by theme, deck or trading goal.
            </p>
          </div>
        ) : (
          <div className="page-stack">
            {binders.map((b) => {
              const title = b.title || b.name || 'Untitled Binder';
              const meta = [b.format, b.description].filter(Boolean).join(' • ');

              return (
                <div
                  key={b.id}
                  className="soft-panel d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                >
                  <div>
                    <h3 className="h5 mb-1">{title}</h3>
                    {meta ? <p className="text-muted mb-0 small">{meta}</p> : null}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/binder/${b.id}`, { state: { binderId: b.id } })}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/binder/${b.id}/add`)}
                    >
                      Add Cards
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => navigate('/edit-binder', { state: { id: b.id } })}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteBinder(b.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}

export default Binders;
