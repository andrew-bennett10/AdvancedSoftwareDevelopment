import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function ViewBinder() {
  return (
    <div>
      <NavigationBar activePage="binders" />

      {/* Binder Display Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow">
              <h2 className="text-center mb-4">View Binder</h2>
              <p className="text-center text-muted mb-0">
                Binder details will appear here soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewBinder;
