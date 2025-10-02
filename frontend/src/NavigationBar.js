import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function NavigationBar({ activePage }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('userData');
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand">PokeBinder</span>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <button 
                className={`btn btn-dark nav-link ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => navigate('/home')}
              >
                Home
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn btn-dark nav-link ${activePage === 'favourites' ? 'active' : ''}`}
                onClick={() => navigate('/favourites')}
              >
                Favourites
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`btn btn-dark nav-link ${activePage === 'account' ? 'active' : ''}`}
                onClick={() => navigate('/account')}
              >
                Edit Account
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`btn btn-dark nav-link ${activePage === 'binders' ? 'active' : ''}`}
                onClick={() => navigate('/binders')}
              >
                Binders
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
  );
}

export default NavigationBar;
