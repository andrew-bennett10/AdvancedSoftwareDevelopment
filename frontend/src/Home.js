import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on component mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    console.log('Raw userData from localStorage:', userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/');
        return;
      }
    } else {
      // No user data found, redirect to login
      console.log('No user data found, redirecting to login');
      navigate('/');
      return;
    }
  }, [navigate]);

  return (
    <div>
      <NavigationBar activePage="home" />

      {/* Component content */}
      <div className="container mt-4">
        <div className="text-center mt-5">
          <h1>Welcome {user?.username || user?.email || 'User'}!</h1>
          <p>You are successfully logged in.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
