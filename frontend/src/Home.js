import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Account from './Account'; 
import Binders from './Binders';

function Home() {
  const [activeComponent, setActiveComponent] = useState('home');
  // key to signal Binders to reset its internal state
  const [binderResetKey, setBinderResetKey] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    // Clear any stored authentication data
    setUser(null); // Clear user state
    localStorage.removeItem('userData'); // Clear user data if stored
    
    // Clear any form data that might be cached
    sessionStorage.clear(); // Clear session storage
    
    navigate('/');
  };

  const renderComponent = () => {
    
    switch (activeComponent) {
      case 'account':
        return <Account />;
      case 'binders':
        // pass reset key prop so you can reset its local state later
        return <Binders resetKey={binderResetKey} />;
      default:
        return (
          <div className="text-center mt-5">
            <h1>Welcome {user?.username || user?.email || 'User'}!</h1>
            <p>You are successfully logged in.</p>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">PokeBinder</span>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button className="btn btn-dark nav-link" onClick={() => setActiveComponent('home')}>
                  Home
                </button>
              </li>
              <li className="nav-item">
                <button className="btn btn-dark nav-link" onClick={() => setActiveComponent('account')}>
                  Edit Account
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-dark nav-link"
                  onClick={() => {
                    // show Binders view and increment key to reset its internal state
                    setActiveComponent('binders');
                    setBinderResetKey(k => k + 1);
                  }}
                >Binders
                </button>
              </li>
            </ul>
            <ul className="navbar-nav">
              <li className="nav-item">
                <button className="btn btn-outline-light" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Component content */}
      <div className="container mt-4">
        {renderComponent()}
      </div>
    </div>
  );
}

export default Home;
