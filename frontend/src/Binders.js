import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home'; 

function Binders() {
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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Create Binder</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="text" 
              placeholder="Insert name here" 
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="typeOfCard" className="form-label">type of card</label>
            <input 
              type="text" 
              className="form-control" 
              id="typeOfCard" 
              placeholder="Insert card type (eg pokemon, item, energy etc)" 
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Create Binder
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

export default Binders;
