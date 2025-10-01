import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function Binders() {
  const navigate = useNavigate();
  // eslint-disable-next-line
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    typeOfCard: ''
  });
  const [binders, setBinders] = useState([]);

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
    if (!user) return; // wait until auth check sets the user

    const fetchBinders = async () => {
      try {
        const res = await fetch('http://localhost:12343/binders');
        if (!res.ok) {
          console.error('Failed to fetch binders', res.status);
          return;
        }
        const data = await res.json();
        setBinders(data.binders || []);
      } catch (err) {
        console.error('Error fetching binders:', err);
      }
    };

    fetchBinders();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Add backend API call to create binder
    console.log('Creating binder:', formData);
    alert('Binder creation functionality - to be implemented');
    
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
              <h2 className="text-center mb-4">Binders</h2>
                {/* List binders from DB */}
                <div className="mt-4">
                  {binders.length === 0 ? (
                    <p>No binders found.</p>
                  ) : (
                    binders.map((b) => (
                      <div key={b.id} className="d-flex align-items-center mb-2 justify-content-between">
                        <p className="mb-0 flex-grow-1 pe-2">
                          {b.name} - {b.typeofcard || b.typeOfCard || b.typeofCard || b.typeOfcard || ''}
                        </p>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary px-3"
                            onClick={() => navigate('/view-binder', { state: { id: b.id } })}
                          >View
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
               <form onSubmit={handleSubmit}>
                {/* navigate to the create Binder page */}
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={() => navigate('/create-binder')}
                >Create Binder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Binders;
