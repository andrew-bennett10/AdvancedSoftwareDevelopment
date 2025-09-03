import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Account from './Account'; 
import Binders from './Binders';

function Home() {
  const [activeComponent, setActiveComponent] = useState('home');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'account':
        return <Account />;
      case 'binders':
        return <Binders />;
      default:
        return (
          <div className="text-center mt-5">
            <h1>Welcome Home!</h1>
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
                <button className="btn btn-dark nav-link" onClick={() => setActiveComponent('binders')}>
                  Create Binder
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
