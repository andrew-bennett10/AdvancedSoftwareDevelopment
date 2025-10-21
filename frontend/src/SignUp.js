import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });


  useEffect(() => {
    if (localStorage.getItem('userData')) {
      navigate('/home');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Signed up user:", data.user);
        
        // Store user data for the session (same as login)
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        alert("Signup successful!");
        navigate("/home");
      } else {
        const errData = await res.json();
        alert(errData.error || 'Signup failed');
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to connect to server");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              id="username" 
              placeholder="Enter username" 
              required 
              value={formData.username} 
              onChange={handleChange} 
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              placeholder="Enter your email" 
              required 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password" 
              placeholder="Enter your password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="confirmPassword" 
              placeholder="Confirm your password" 
              required 
              value={formData.confirmPassword} 
              onChange={handleChange} 
            />
          </div>

          <p className="text-center">
            Already have an account? <Link to="/">Login</Link>
          </p>

          <button type="submit" className="btn btn-success w-100">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;












// import React, { useState } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Home from './Home'; // import your Home component
// import { Link } from 'react-router-dom';


// function SignUp() {
//   const [showHome, setShowHome] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setShowHome(true); // switch to Home page after signup
//   };

//   if (showHome) {
//     return <Home />; // render Home component
//   }

//   return (
//     <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
//       <div className="card p-4 shadow" style={{ minWidth: '300px', maxWidth: '400px', width: '100%' }}>
//         <h2 className="text-center mb-4">Sign Up</h2>
//         <form onSubmit={handleSubmit}>
//           {/* Full Name */}
//           <div className="mb-3">
//             <label htmlFor="name" className="form-label">Full Name</label>
//             <input 
//               type="text" 
//               className="form-control" 
//               id="name" 
//               placeholder="Enter your full name" 
//               required
//             />
//           </div>

//           {/* Email */}
//           <div className="mb-3">
//             <label htmlFor="email" className="form-label">Email</label>
//             <input 
//               type="email" 
//               className="form-control" 
//               id="email" 
//               placeholder="Enter your email" 
//               required
//             />
//           </div>

//           {/* Password */}
//           <div className="mb-3">
//             <label htmlFor="password" className="form-label">Password</label>
//             <input 
//               type="password" 
//               className="form-control" 
//               id="password" 
//               placeholder="Enter your password" 
//               required
//             />
//           </div>

//           {/* Confirm Password */}
//           <div className="mb-3">
//             <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
//             <input 
//               type="password" 
//               className="form-control" 
//               id="confirmPassword" 
//               placeholder="Confirm your password" 
//               required
//             />
//           </div>

//             <p className="text-center">
//                 Already have an account? <Link to="/">Login</Link>
//             </p>



//           {/* Submit button */}
//           <button type="submit" className="btn btn-success w-100">
//             Sign Up
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default SignUp;
