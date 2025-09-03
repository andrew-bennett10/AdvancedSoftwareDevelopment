import React from 'react';
import Login from './Login';
import Favourites from './Favourites';
import Home from './Home';

function App() {
  const path = window.location.pathname;
  if (path === '/favourites') return <Favourites />;
  if (path === '/home') return <Home />;
  return <Login />;
}

export default App;

