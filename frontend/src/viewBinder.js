import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './NavigationBar';

function ViewBinder() {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    typeOfCard: ''
  });
  const [binderId, setBinderId] = useState(null);

//   ALL OF THIS IS STUFF THAT'S HERE SINCE I COPY PASTE'D THIS FROM EDITBINDER,
//   IT'S NOT NECESSARY FOR THE BLANK TEMPLATE PAGE BUT PROB USEFUL FOR ACTUALLY MAKING THE PAGE
//   // Check if user is logged in on component mount
//   useEffect(() => {
//     const userData = localStorage.getItem('userData');
    
//     if (userData) {
//       try {
//         const parsedUser = JSON.parse(userData);
//         setUser(parsedUser);
//       } catch (error) {
//         console.error('Error parsing user data:', error);
//         localStorage.removeItem('userData');
//         navigate('/');
//         return;
//       }
//     } else {
//       // No user data found, redirect to login
//       navigate('/');
//       return;
//     }
//   }, [navigate]);

//   // Since you're coming from Binders, location.state.id will be passed.
//   // If you somehow get here from somewhere else, try to fetch binder by id if query state exists.
//   useEffect(() => {
//     const idFromState = location?.state?.id;
//     if (idFromState) {
//       setBinderId(idFromState);
//       // fetch binder details to prefill form
//       (async () => {
//         try {
//           const res = await fetch(`http://localhost:12343/binders/${idFromState}`);
//           if (res.ok) {
//             const data = await res.json();
//             if (data.binder) {
//               setFormData({ name: data.binder.name || '', typeOfCard: data.binder.typeofcard || data.binder.typeOfCard || '' });
//             }
//           }
//         } catch (err) {
//           console.error('Failed to fetch binder for edit:', err);
//         }
//       })();
//     }
//   }, [location]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.id]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     //edit a binder (not needed here, just still here from )
//     try {
//       const res = await fetch('http://localhost:12343/view-binder', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             id: binderId,
//             name: formData.name,
//             typeOfCard: formData.typeOfCard
//         })
//       });

//       if (res.ok) {
//         const data = await res.json();
//         console.log('Edited binder:', data.binder);
//         alert('Your binder has evolved!');
//         // go back to Binders page
//         navigate('/binders');
//       } else {
//         const errData = await res.json();
//         alert(errData.error || 'You stopped the evolution');
//       }
//     } catch (err) {
//       console.error('Error:', err);
//       alert('Could not connect to server');
//     }
    
//     // Clear form
//     setFormData({
//       name: '',
//       typeOfCard: ''
//     });
//   };

  return (
    <div>
      <NavigationBar activePage="binders" />

      {/* Binder Creation Content */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow">
              <h2 className="text-center mb-4">View Binder</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewBinder;
