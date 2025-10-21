import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function CreateBinder() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    typeOfCard: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Get user data for achievement tracking
    let userId = user?.id ?? null;
    if (!userId) {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData);
          userId = parsedUser?.id ?? null;
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
        }
      }
    }

    // create binder via backend endpoint (same approach as accounts)
    try {
      const response = await fetch(`${API_BASE}/binders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: userId,
          title: formData.name,
          format: 'Standard',
          name: formData.name,
          type_of_card: formData.typeOfCard
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || 'The wild binder has fled...';
        throw new Error(errorMessage);
      }

      console.log('Created binder:', data.binder);

      // Check if an achievement was unlocked
      const achievement = data?.achievement;
      if (achievement) {
        window.dispatchEvent(
          new CustomEvent('achievement:unlocked', {
            detail: {
              achievement: {
                ...achievement,
                icon: '📚',
              }
            },
          })
        );
      }

      alert('A wild Binder has appeared!');
      setFormData({ name: '', typeOfCard: '' });
      // Go back to Binders page
      navigate('/binders');
    } catch (err) {
      console.error('Create binder error:', err);
      setError(err.message || 'Failed to create binder');
      if (err?.message) {
        alert(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <NavigationBar activePage="binders" />

      {/* Binder Creation Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow">
              <h2 className="text-center mb-4">Create Binder</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="name" 
                    placeholder="Enter name" 
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="typeOfCard" className="form-label">Type of Card</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="typeOfCard" 
                    placeholder="Enter card type (eg pokemon, item, energy etc)" 
                    required
                    value={formData.typeOfCard}
                    onChange={handleChange}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Binder'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBinder;
