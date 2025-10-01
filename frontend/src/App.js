import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';
import Home from './Home';
import Account from './Account';
import Binders from './Binders';
import CreateBinder from './createBinder';
import EditBinder from './editBinder';
import ViewBinder from './viewBinder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="/binders" element={<Binders />} />
        <Route path="/create-binder" element={<CreateBinder />} />
        <Route path="/edit-binder" element={<EditBinder />} />
        <Route path="/view-binder" element={<ViewBinder />} />
      </Routes>
    </Router>
  );
}

export default App;
