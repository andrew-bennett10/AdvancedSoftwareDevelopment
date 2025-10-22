import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function EditBinder() {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    typeOfCard: ''
  });
  const [binderId, setBinderId] = useState(null);

  const ALLOWED_TYPES = ['pokemon', 'item', 'trainer', 'energy', 'supporter', 'stadium'];
  const normalizeType = (s) => (s || '').toString().trim().toLowerCase();
  const isAllowedType = (s) => ALLOWED_TYPES.includes(normalizeType(s));

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

  // Since you're coming from Binders, location.state.id will be passed.
  // If you somehow get here from somewhere else, try to fetch binder by id if query state exists.
  useEffect(() => {
    const idFromState = location?.state?.id;
    if (idFromState) {
      setBinderId(idFromState);
      // fetch binder details to prefill form
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/binders/${idFromState}`);
          if (res.ok) {
            const data = await res.json();
            if (data.binder) {
              setFormData({
                name: data.binder.name || '',
                typeOfCard: data.binder.typeOfCard || data.binder.type_of_card || '',
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch binder for edit:', err);
        }
      })();
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAllowedType(formData.typeOfCard)) {
      alert(`Type of Card must be one of: ${ALLOWED_TYPES.join(', ')}`);
      return;
    }

    //edit a binder
    try {
      const res = await fetch(`${API_BASE}/edit-binder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: binderId,
            name: formData.name,
            typeOfCard: formData.typeOfCard
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Edited binder:', data.binder);
        alert('Your binder has evolved!');
        // go back to Binders page
        navigate('/binders');
      } else {
        const errData = await res.json();
        alert(errData.error || 'You stopped the evolution');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Could not connect to server');
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
              <h2 className="text-center mb-4">Edit Binder</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">New Name</label>
                  <input 
                    type="text" 
                    pattern="[A-Za-z]+"
                    className="form-control" 
                    id="name" 
                    placeholder="Enter name" 
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="typeOfCard" className="form-label">New Type of Card</label>
                  <input 
                     type="text"
                     list="type-options"
                    className="form-control" 
                    id="typeOfCard" 
                    placeholder="Enter card type (eg pokemon, item, energy etc)" 
                    required
                    value={formData.typeOfCard}
                    onChange={handleChange}
                  />
                  <datalist id="type-options">
                    {ALLOWED_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Edit Binder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditBinder;
