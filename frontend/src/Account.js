import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home'; 

function Account() {
  const [showHome, setShowHome] = useState(false);
    const [activeComponent, setActiveComponent] = useState('home');

  const handleSubmit = (e) => {
    e.preventDefault();
    // setShowHome(true); // switch to Home page
  };

  if (showHome) {
    return <Home />; // render Home component
  }

  const renderComponent = () => {
      switch (activeComponent) {
        case 'account':
          return <Account />;
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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Edit Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              placeholder="Enter new email" 
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password" 
              placeholder="Enter new password" 
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Confirm
          </button>
        </form>
      </div>

    {/* Component content
      <div className="container mt-4">
        {renderComponent()}
      </div> */}
    </div>

  );
}

export default Account;
