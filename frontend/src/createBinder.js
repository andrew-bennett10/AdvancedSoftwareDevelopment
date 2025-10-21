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

  const resolveAccountId = () => {
    const storedAccountId = Number(localStorage.getItem('accountId'));
    if (Number.isFinite(storedAccountId) && storedAccountId > 0) {
      return storedAccountId;
    }

    if (user && user.id) {
      const parsed = Number(user.id);
      if (Number.isFinite(parsed) && parsed > 0) {
        localStorage.setItem('accountId', String(parsed));
        return parsed;
      }
    }

    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          const id = Number(parsedUser.id);
          if (Number.isFinite(id) && id > 0) {
            localStorage.setItem('accountId', String(id));
            setUser(parsedUser);
            return id;
          }
        }
      } catch (err) {
        console.error('Failed to parse stored userData:', err);
      }
    }

    return NaN;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get user data for achievement tracking
    const userData = localStorage.getItem('userData');
    let userId = null;
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        userId = parsedUser.id;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // create binder via backend endpoint (same approach as accounts)
    try {
      const res = await fetch(`${API_BASE}/create-binder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          typeOfCard: formData.typeOfCard,
          userId: userId
        })
      });

      if (res.ok) {
        const data = await res.json();
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
        // go back to Binders page
        navigate('/binders');
      } else {
        const errData = await res.json();
        alert(errData.error || 'The wild binder has fled...');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create binder');
      }

      console.log('Created binder:', data);
      alert('Binder created successfully!');
      setFormData({ name: '', typeOfCard: '' });
      navigate('/binders');
    } catch (err) {
      console.error('Create binder error:', err);
      setError(err.message || 'Failed to create binder');
    } finally {
      setIsSubmitting(false);
    }
    
    // Clear form
    setFormData({
      name: '',
      typeOfCard: ''
    });
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
