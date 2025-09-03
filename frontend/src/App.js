import React from 'react';
import Login from './Login';
import Favourites from './Favourites';

function App() {
  const path = window.location.pathname;
  if (path === '/favourites') {
    return <Favourites />;
  }
  return <Login />;
}

export default App;
