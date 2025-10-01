import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function CreateBinder() {
  const navigate = useNavigate();
  // eslint-disable-next-line
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    typeOfCard: ''
  });

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

    // create binder via backend endpoint (same approach as accounts)
    try {
      const res = await fetch('http://localhost:12343/create-binder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          typeOfCard: formData.typeOfCard
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Created binder:', data.binder);
        alert('A wild Binder has appeared!');
        // go back to Binders page
        navigate('/binders');
      } else {
        const errData = await res.json();
        alert(errData.error || 'The wild binder has fled...');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Could not connect to server');
    }
    
    // TODO: Add backend API call to create binder
    // console.log('Creating binder:', formData);
    // alert('Binder creation functionality - to be implemented');
    
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
                    required
                    value={formData.typeOfCard}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Create Binder
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
