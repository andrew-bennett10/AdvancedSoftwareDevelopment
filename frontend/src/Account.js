import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './components/PageLayout';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Update Details Form
  const [detailsForm, setDetailsForm] = useState({
    username: '',
    email: ''
  });
  
  // Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Check authentication and load user data
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Autofill the form with current user data
        setDetailsForm({
          username: parsedUser.username || '',
          email: parsedUser.email || ''
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/');
        return;
      }
    } else {
      // No user data found, redirect to login
      navigate('/');
      return;
    }
  }, [navigate]);

  const handleDetailsChange = (e) => {
    setDetailsForm({ ...detailsForm, [e.target.id]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.id]: e.target.value });
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/update-account`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: detailsForm.username,
          email: detailsForm.email
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update localStorage with new user data
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
        
        alert('Account details updated successfully!');
        // Redirect to home after successful update
        navigate('/home');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update account details');
        
        // If email already exists, reload the original data
        if (errData.error && errData.error.includes('already exists')) {
          setDetailsForm({
            username: user.username || '',
            email: user.email || ''
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Could not connect to server");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Check if new passwords match
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      alert("New passwords don't match!");
      // Clear password fields
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        alert('Password changed successfully!');
        
        // Clear the password form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to change password');
        
        // Clear password fields on failure
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Could not connect to server");
    }
  };

  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/delete-account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id
        })
      });

      if (res.ok) {
        alert('Account deleted successfully');
        
        // Clear all user data
        localStorage.removeItem('userData');
        sessionStorage.clear();
        
        // Redirect to login
        navigate('/');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Could not connect to server");
    }
  };

  return (
    <PageLayout
      activePage="account"
      title="Account Settings"
      description="Update your profile details, keep your password fresh, or leave the platform from one consistent hub."
    >
      <div className="page-grid page-grid--two">
        <section className="page-surface page-stack page-stack--sm">
          <div>
            <h2 className="h5 text-uppercase text-secondary mb-2">Profile</h2>
            <p className="text-muted mb-0">
              Keep your username and email address up to date so friends can find you.
            </p>
          </div>
          <form onSubmit={handleDetailsSubmit} className="page-stack page-stack--sm">
            <div>
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="Enter username"
                required
                value={detailsForm.username}
                onChange={handleDetailsChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter email"
                required
                value={detailsForm.email}
                onChange={handleDetailsChange}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Update details
            </button>
          </form>
        </section>

        <section className="page-surface page-stack page-stack--sm">
          <div>
            <h2 className="h5 text-uppercase text-secondary mb-2">Security</h2>
            <p className="text-muted mb-0">
              Change your password regularly to keep your collection safe.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="page-stack page-stack--sm">
            <div>
              <label htmlFor="currentPassword" className="form-label">Current password</label>
              <input
                type="password"
                className="form-control"
                id="currentPassword"
                placeholder="Enter current password"
                required
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="form-label">New password</label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                placeholder="Enter new password"
                required
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                id="confirmNewPassword"
                placeholder="Confirm new password"
                required
                value={passwordForm.confirmNewPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <button type="submit" className="btn btn-outline-secondary">
              Change password
            </button>
          </form>
        </section>
      </div>

      <section className="page-surface page-surface--muted page-stack page-stack--sm">
        <div>
          <h2 className="h5 text-uppercase text-danger mb-2">Danger zone</h2>
          <p className="text-muted mb-0">
            Once you delete your account there is no going back. All data will be removed permanently.
          </p>
        </div>
        <button className="btn btn-danger align-self-start" onClick={handleDeleteAccount}>
          Delete account
        </button>
      </section>
    </PageLayout>
  );
}

export default Account;
